import React, { useState, createContext, useEffect, useRef } from 'react';
import useLocalStorage from '../Hooks/useLocalStorage';

export const Context = createContext({});

export const ContextProvider = (props) => {
  const [loggedEmployeeEmail, setLoggedEmployeeEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(1);
  const [timeActive, setTimeActive] = useState(false);
  const [employeeList, setEmployeeList] = useLocalStorage('employeeList', [
    { name: 'Natalia', id: '4544444', email: 'ngr@gmail.com' },
    { name: 'Pedro', id: '6755555', email: 'pedrojh@gmail.com' },
  ]);

  const [officeLocationList, setOfficeLocationList] = useLocalStorage(
    'officeLocationList',
    [
      { name: 'Bogota', id: '4544444' },
      { name: 'Bucaramanga', id: '6755555' },
    ]
  );
  const [employeePerOfficeList, setEmployeePerOfficeList] = useLocalStorage(
    'employeePerOfficeList',
    [
      { office: 'Bogota', employee: 'Natalia' },
      { office: 'Bucaramanga', employee: 'Natalia' },
      { office: 'Bucaramanga', employee: 'Jorge' },
    ]
  );
  const [emailList, setEmailList] = useLocalStorage('emailList', [
    { email: 'pruebaxx@gmail.com' },
    { email: 'pruebagg@gmail.com' },
  ]);

  const updateEmployeeList = (employeeList) => {
    setEmployeeList(() => employeeList);
  };

  const updateOfficeLocationList = (officeLocationList) => {
    setOfficeLocationList(() => officeLocationList);
  };

  const updateEmployeePerOfficeList = (employeePerOfficeList) => {
    setEmployeePerOfficeList(() => employeePerOfficeList);
  };
  const updateUser = () => {
    setCurrentUser(2);
  };

  const updateTimeActive = (timeActive) => {
    setTimeActive(() => timeActive);
  };

  const updateLoggedEmployeeEmail = (newLoggedEmployeeEmail) => {
    setLoggedEmployeeEmail(() => newLoggedEmployeeEmail);
  };

  const addNewEmployee = (newName, newEmail) => {
    setEmployeeList([...employeeList, { name: newName, email: newEmail }]);
  };

  const addNewOfficeLocation = (newName, newId) => {
    setOfficeLocationList([
      ...officeLocationList,
      { name: newName, id: newId },
    ]);
  };

  const addNewemployeePerOffice = (newOffice, newEmployee) => {
    setEmployeePerOfficeList([
      ...employeePerOfficeList,
      { office: newOffice, employee: newEmployee },
    ]);
  };

  const deleteEmployee = (employee) => {
    setEmployeeList((prev) => {
      return prev.filter((employeeItem) => {
        const isSameEmployee = employeeItem.email === employee.email;
        return !isSameEmployee;
      });
    });
  };
  const deleteLocation = (location) => {
    setOfficeLocationList((prev) => {
      return prev.filter((locationItem) => {
        const isSameLocation = locationItem.id === location.id;
        return !isSameLocation;
      });
    });
  };

  const deleteLocationPerEmployee = (locationPerEmployee) => {
    setEmployeePerOfficeList((prev) => {
      return prev.filter((locationPerEmployeeItem) => {
        const isSameLocationPerEmployee =
          locationPerEmployeeItem.office === locationPerEmployee.office;
        return !isSameLocationPerEmployee;
      });
    });
  };

  const addNewEmail = (newEmail) => {
    setEmailList([...emailList, { email: newEmail }]);
  };

  return (
    <Context.Provider
      value={{
        deleteLocationPerEmployee: deleteLocationPerEmployee,
        deleteLocation: deleteLocation,
        loggedEmployeeEmail: loggedEmployeeEmail,
        deleteEmployee: deleteEmployee,
        addNewEmail: addNewEmail,
        updateLoggedEmployeeEmail: updateLoggedEmployeeEmail,
        emailList: emailList,
        addNewemployeePerOffice: addNewemployeePerOffice,
        addNewOfficeLocation: addNewOfficeLocation,
        addNewEmployee: addNewEmployee,
        updateEmployeePerOfficeList: updateEmployeePerOfficeList,
        updateofficeLocationList: updateOfficeLocationList,
        updateEmployeeList: updateEmployeeList,
        employeePerOfficeList: employeePerOfficeList,
        officeLocationList: officeLocationList,
        employeeList: employeeList,
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
