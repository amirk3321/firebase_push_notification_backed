//4 type of triggers 
// onCreate , onUpdate , onDelete , onWrite

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

const fcm=admin.messaging();


//send notificatoin to spacific device
export const sendNotificationToDevices=functions.
firestore.document('chatChannel/{channelId}/messages/{messageId}').
onCreate(async (doc,context) => {


    const data =doc.data();
    if (data){
        const senderName=data.senderName;
        const recipientId=data.recipientId;
        const content =data.content;
        return admin.firestore().doc('user/'+recipientId)
        .get().then(async(userDoc) => {


            const user=userDoc.data();

            if (user){
                
                
                const token=user.token;

                const notificationBody = (data.type == 'TEXT'?content:"you received new Image message");
                
                const playload ={
                    notification : {
                        title : senderName + " sent you a message",
                        body : notificationBody,
                        clickAction:'FLUTTER_NOTIFICATION_CLICK'
                    },
                    data :{
                        screen:'SingleChatPage',
                        status:'/SingleChatPage'
                    }
                }

                return fcm.sendToDevice(token,playload).then(response => {
                    //sink all the token that are used
                    //if user uninstall the app or clear data of the off
                    //are through awaya his phone in that case
                    //we delete firebase token from firestore db
                    //1st we will get all the tokens
                    const sillRegistrationTokens=token;
                    
                    response.results.forEach((result,index)=>{

                    //here 1st we can check error for all the msgs
                    //we get 1st error msg
                    const error =result.error;
                    //check if ther error is not null we will get
                    //the fail registration token
                    if (error){
                        const failedTokens=token[index];
                        console.error("failed registration token ",failedTokens,error);
                        if (error.code == 'messaging/registration-token-not-registered'||
                        error.code == 'messaging/invalid-registration-token'){
                            const failedIndex=sillRegistrationTokens.indexOf(failedTokens);
                            if (failedIndex > -1){
                                sillRegistrationTokens.splice(failedIndex,1);
                            }
                        }
                    }

                    });
                    return admin.firestore().doc('user/'+recipientId).update({
                        'token':sillRegistrationTokens
                    });
                });
            }else{
                console.log(`user does not exists`)
                return null;
            }

        })
    }else{
        console.error("there is no document sender name is Undifined")
        return null;
    }


});

//add new docuemnt in firestore
export const addNewUser=functions.https.onCall((data,context) =>{
    const newUser=admin.firestore().collection("user");
    console.log("new document added : \nname :"+data['namee']+"\nemail :"+data['email']);
    return newUser.add({
        name :data['namee'],
        email:data['email'],
        token:data['token'],
        platfrom:data['platform'],
    });
})


//update doc if exists
export const updateExistingDoc=functions.https.onCall((data,context) => {

    const existsUser=admin.firestore().collection("user");
    console.log("Existing doc is Updated with : \nname :"+data['namee']+"\nemail :"+data['email'])
    return existsUser.doc(data["documentId"]).update({
        name:data['namee'],
        email:data['email'],
    })

})
//delete existing doc
export const deleteExistingDocumnet=functions.https.onCall((data,context) => {
   const deleteDoc=admin.firestore().collection("user");
   console.log("documet is Delete form User collection successfuly ");
   return deleteDoc.doc('documentId').delete(); 
})



// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = functions.https.onRequest((request, response) => {
//     console.log('hello firebase world')
//  response.send("Hello from Firebase! this is cloud function");
// });
