

## Author
- [@Rubil-Mogere-94](https://github.com/Rubil-Mogere-94)

## Description
This application allows the employee user to generate a QR code corresponding to a link with their identification or email information, as well as obtain their location at the moment they access their account. The administrator user has the ability to add employees to the existing ones, add locations, and generate a table that links or correlates each existing employee to an existing location. Using the above information, the administrator can verify, by reading the QR code, a unique email for each employee and check if they exist in the existing database. Similarly, the administrator can verify if the obtained location is near any existing location assigned to the employee.
## implemented technologies
- Node.js
- React
- Material UI
- React Context 
- React Router 
- Hooks: UseLocalStorage
- LocalStorage

## features
Responsive Landing Page

All information is stored in Local Storage
## Visitors web

1. Landing Page

Landing Page

2. Employee Login

Employee Login

3. Employee Account

Upon entering their email and password, the employee receives a notification confirming the generation of the QR code. As seen in the code, the logged-in email is stored in a state and added to the generated link. As an example, this value can be retrieved using the UseParams hook and displayed in the console. If the administrator wanted to implement an automatic reading of all emails and then use a Find() function to verify whether that email exists in the database, they could deny or allow an employee's access to a specific location based on the unique identification of that email.

Employee Account

4. Administrator Account

4.1.Employee list
-The administrator can create new employees as well as delete existing ones.

Employee List

4.2. List of Locations
The administrator can create new locations as well as delete existing ones.

Locations List

4.3. Employee-Location Junction Table

The Employee List and Location List tables exist if and only if, allowing the administrator to later link employees to locations. This way, the Autocomplete will only allow the administrator to select employees and locations that are contained in these tables to prevent administrative management errors. This employee-location linking table will be essential when verifying employee identification and their assigned location.

Junction List
## Deploy
https://check-in-with-qr.vercel.app/

## Prerequisites

## Setup

First, [fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo).

```bash
# Clone the starter code
git clone https://github.com/<your-username>/check-in-with-qr.git 
# Install the project's dependencies
yarn install
```
## Running the App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

To run the app, run:

```bash
yarn start
```
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


