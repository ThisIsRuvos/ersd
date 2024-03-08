# Change Log: eRSD Release 1.4.0

### Database Migration
- Architectural Update:
  - Database migrated from MySQL to Postgres

### HAPI
- Architectural Update:
  - Project updated to use the most recent HAPI release.
  
### Registration/Create User Form

- Interface Update:
  - The user is only able to click the save button once. Preventing potentially multiple form submissions.

### Change Preview Page

- Interface Update:
  - The image, when no Change Preview information is available, has been removed. The notification messages has been revised.

### Administrator Page
- Functionality Update:
  - Unauthorized users are unable to access admin functions.
- Interface Update:
  - Notified that they don't not have access to admin functions, and have the option to return to the home page.

### Administrator - Edit User

- Functionality Update:
  - Character not showing under "Organization" input field and state of the saved button being incorrectly updated has been resolved.
  - After  clicking the "Enable Secondary Contact" toggle, the user has to enter the required fields before the from can be saved.