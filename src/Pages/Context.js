import React, { useState, createContext } from 'react';
import useLocalStorage from '../Hooks/useLocalStorage';

export const Context = createContext({});

export const ContextProvider = (props) => {
  const [loggedEmployeeEmail, setLoggedEmployeeEmail] = useState('');
  const [loggedAdminEmail, setLoggedAdminEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(1);
  const [timeActive, setTimeActive] = useState(false);
  const [emailList, setEmailList] = useLocalStorage('emailList', [
    { email: 'pruebaxx@gmail.com' },
    { email: 'pruebagg@gmail.com' },
  ]);
  const updateUser = (userType) => {
    setCurrentUser(userType);
  };

  const updateTimeActive = (timeActive) => {
    setTimeActive(() => timeActive);
  };

  const updateLoggedEmployeeEmail = (newLoggedEmployeeEmail) => {
    setLoggedEmployeeEmail(() => newLoggedEmployeeEmail);
  };

  const updateLoggedAdminEmail = (newEmail) => {
    setLoggedAdminEmail(() => newEmail);
  };

  const addNewEmail = (newEmail) => {
    setEmailList([...emailList, { email: newEmail }]);
  };

  return (
    <Context.Provider
      value={{
        loggedEmployeeEmail: loggedEmployeeEmail,
        loggedAdminEmail: loggedAdminEmail,
        updateLoggedAdminEmail: updateLoggedAdminEmail,
        addNewEmail: addNewEmail,
        updateLoggedEmployeeEmail: updateLoggedEmployeeEmail,
        emailList: emailList,
        currentUser: currentUser,
        updateUser: updateUser,
        timeActive: timeActive,
        updateTimeActive: updateTimeActive,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
