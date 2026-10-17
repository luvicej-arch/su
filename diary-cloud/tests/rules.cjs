const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,deleteDoc,getDocs,query,collection,limit,serverTimestamp,Timestamp}=require('firebase/firestore');
const fs=require('node:fs');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-classroom-diary',firestore:{host:'127.0.0.1',port:19481,rules:fs.readFileSync('firestore.rules','utf8')}});try{
 const claims={email_verified:true,firebase:{sign_in_provider:'google.com'}};const alice=env.authenticatedContext('alice',claims).firestore(),bob=env.authenticatedContext('bob',claims).firestore(),anon=env.unauthenticatedContext().firestore();
 const entryPath='users/alice/entries/test';const data={title:'검증',body:'합성 테스트',mood:'😊',date:Timestamp.fromDate(new Date('2026-10-17T00:00:00Z')),createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(alice,entryPath),data));await assertSucceeds(getDoc(doc(alice,entryPath)));
 await assertFails(getDoc(doc(bob,entryPath)));await assertFails(getDoc(doc(anon,entryPath)));await assertFails(setDoc(doc(bob,'users/alice/entries/other'),data));
 await assertSucceeds(updateDoc(doc(alice,entryPath),{title:'수정',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(alice,entryPath),{createdAt:Timestamp.fromMillis(0),updatedAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(alice,entryPath),{role:'admin',updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(alice,entryPath),{body:'x'.repeat(50001),updatedAt:serverTimestamp()}));await assertFails(updateDoc(doc(alice,entryPath),{date:'2026-02-31',updatedAt:serverTimestamp()}));
 await assertSucceeds(getDocs(query(collection(alice,'users/alice/entries'),limit(200))));await assertFails(getDocs(collection(alice,'users/alice/entries')));await assertFails(getDocs(query(collection(bob,'users/alice/entries'),limit(200))));
 const password=env.authenticatedContext('alice',{email_verified:true,firebase:{sign_in_provider:'password'}}).firestore();await assertFails(getDoc(doc(password,entryPath)));
 await assertFails(deleteDoc(doc(bob,entryPath)));await assertSucceeds(deleteDoc(doc(alice,entryPath)));console.log('PASS: owner CRUD, cross-user and anonymous denied, Google-only, schema/size/date/immutable timestamp validation, bounded list');
}finally{await env.cleanup();}})().catch(error=>{console.error(error);process.exitCode=1});
