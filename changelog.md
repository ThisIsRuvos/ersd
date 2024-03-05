# Change Log: eRSD v1.3.8

## This release addresses the following

### Login/Logout

* Functionality Update:
    * When the user clicked the logout link, they were redirected to the login page. Once on this page it reloads a second time.

### Home Page
* Updated Interface:
    * The activity spinners showed on both buttons when download was clicked.

### Change Preview Page

* Interface Update:
    * When no Change Preview information is available. The user will be notified with an appropriate message and option to redirect to the home page.

### Administration Page

* Interface Update:
    * Updated the interface of the Admin Users table so that it no longer overflows on smaller viewports
    * Unauthorized users are appropriately notified that they do not have the right access level to view the Admin content (if they use the URL to access the page) and provided with a link to redirect to the home page.
#### Users
* Interface Update:
    * The save button is disabled until the user updates a field on the form.
#### Email Address
* Functionality Update:
    * Admin page’s email list retrieval was enhanced to support paging for retrieval of large result sets.

### Profile Page

#### User Section
* Interface Update:
    * The save button is disabled until the user updates a field on the form.

#### Notifications
* Interface Update:
    * The save button is disabled until the user updates a field on the form.

### Registration/Create User Form

* Interface Update:
    * The user is only able to click the save button once. Preventing potentially multiple form submissions.
