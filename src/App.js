//default
import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

//cognito authentication 
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';

//appsync api
import {API} from 'aws-amplify';
import {listGroups, listPrayers as listPrayers} from './graphql/queries'
import {createPrayer as createPrayer, deletePrayer as deletePrayer, createGroup} from './graphql/mutations'
import { create, random, result } from 'lodash';

//after imports
Amplify.configure(aws_exports);


//initials
const initialCreatePrayerFormState = {
  title: '',
  description: '',
  groupID: null,
}


function App2() {
  const [prayers, setPrayers] = useState([])
  const [createPrayerFormData, setCreatePrayerFormData] = useState(initialCreatePrayerFormState)
  const [currentUser, setCurrentUser] = useState('not-signed-in')
  const [allGroups, setAllGroups] = useState([])
  

  useEffect(() => {
   fetchMyPrayers();
   fetchAllGroups();
   updateAWSUser();
  }, [])

  async function updateAWSUser() {
    try{
      let user = await Auth.currentAuthenticatedUser();
      console.log(user.username)
      setCurrentUser(user.username)
    } catch (err) {
      console.log ("error", err)
    }
  }


  function makeid(length) {
    var result           = '#';
    var characters       = '0123456789ABCDEF';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

  function getGroupNameFromID (group_id) {
    if(!group_id) return 'invalidID'
    var result = allGroups.find(({ id }) => id == group_id ).name
    if(result != null) return result
    else return 'no result'
  }
  function getPrayerCountFromGroupID (group_id) {
    if(!group_id) return 'invalidID'
    var result = prayers.filter(({groupID}) => groupID == group_id ).length
    if(result != null) return result
    else return 'no result'
  }

  async function fetchMyPrayers() {
    const apiData = await API.graphql({query: listPrayers});
    setPrayers(apiData.data.listPrayers.items);
  }
  async function fetchAllGroups() {
    const apiData = await API.graphql({query: listGroups});
    setAllGroups(apiData.data.listGroups.items);
  }

  async function createNewPrayer() {
    var formToSend;
    if (!createPrayerFormData.title) {
      console.log('createPrayerStoppedEarly');
      return;
    }
    else if (!createPrayerFormData.groupID) {
      formToSend = {
        title: createPrayerFormData.title,
        description: createPrayerFormData.description
      }
    }
    else
      formToSend = createPrayerFormData

    await API.graphql({ query: createPrayer, variables: { input: formToSend } });
    setPrayers([ ...prayers, createPrayerFormData ]);
    setCreatePrayerFormData(initialCreatePrayerFormState);
  }

  async function createNewGroup() {
    var randomGroup = {
      name: makeid(6),
    }
    await API.graphql({ query: createGroup, variables: { input: randomGroup } }).then(() => {fetchAllGroups()})
    // setAllGroups([ ...allGroups, randomGroup ]);
  }

  async function deletePrayerByID({ id }) {
    const newNotesArray = prayers.filter(note => note.id !== id);
    setPrayers(newNotesArray);
    await API.graphql({ query: deletePrayer, variables: { input: { id } }});
  }


  return (
    <div className="App">
      <header className="App-header">
        <div style={{display: 'flex', flexDirection: 'row'}}>

          {/* column 1 */}
          <img src={logo} className="App-logo" alt="logo" />

          {/* column 2 */}
          <div style={{flex:1}}>
            <h1>Add Prayer</h1>

              <input
                onChange={e => setCreatePrayerFormData({ ...createPrayerFormData, 'title': e.target.value})}
                placeholder="Title"
                value={createPrayerFormData.title}
              /> <br/>
              <input
                onChange={e => setCreatePrayerFormData({ ...createPrayerFormData, 'description': e.target.value})}
                placeholder="Description"
                value={createPrayerFormData.description}
              /> <br/>
              <input
                placeholder="Group"
                value={createPrayerFormData.groupID != null ? getGroupNameFromID(createPrayerFormData.groupID) : 'personal'}
                readOnly
              /> <br/>
              {/* <p>{createPrayerFormData.groupID}</p> */}
              <button onClick={() => createNewPrayer()}>Create Prayer</button>
              
            </div>

          {/* column 3 */}
          <div style={{flex:1}}>
              <h1>{currentUser}'s Prayers </h1>
              <div style={{marginBottom: 30}}>
                {
                  prayers.map(prayer => (
                    <div key={prayer.id || prayer.title} style={{ border: '4px dotted lightblue'}}>
                      <h3>{prayer.title}</h3>
                      <p className="smallText">{prayer.description}</p>
                      <p className="smallText">{prayer.groupID? getGroupNameFromID(prayer.groupID) : "-personal-"}</p>
                      {/* <button onClick={() => deletePrayerByID(note)}>Delete note</button> */}
                    </div>
                  ))
                }
              </div>
          </div>


          {/* column 4 */}
            <div style={{flex:1}}>
              <h1>Groups</h1>
              <button onClick={() => createNewGroup()}>Create New Group</button>
              <button onClick={() => console.log(allGroups)}>printGroups</button>

              <div style={{marginBottom: 30}}>
                {
                  allGroups.map(group => (
                    <div key={group.id || group.name} style={{ border: '4px dotted lightblue'}}>
                      <h2>{group.name}</h2>
                      <p className="smallText">PrayerCount: {getPrayerCountFromGroupID(group.id)}</p>
                      <button onClick={() => {
                            console.log('setactive button pressed');
                            setCreatePrayerFormData({ ...createPrayerFormData, 'groupID': group.id})
                          }}>set as Active</button>
                    </div>
                  ))
                }
              </div>
            </div>
        </div>
            
          
      </header> 
    </div>
  );

}



export default withAuthenticator(App2, true);
