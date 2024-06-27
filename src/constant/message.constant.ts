export const messageConstant = {
  // Database Connection Messages
  CONNECTION_ERROR: 'Error while connecting to database',
  DB_CONNECTED: 'MongoDB database connected',

  //Import Export (Google sheet to database and vice versa) messages
  DATA_ADDED_SUCCESSFULLY: 'Data added successfully',
  NO_DATA_FOUND: 'No data found',
  ERROR_INSERTING_DATA: 'Error while inserting data ',
  MISSING_REQUIRED_PARAMETERS: 'Missing required parameters',
  DATA_EXPORTED_SUCCESSFULLY: 'Data exported successfully',
  ERROR_EXPORTING_DATA: 'Error while exporting data',

  // Application Messages
  APP_STARTED: 'Application Running',

  // User Messages
  USER_NOT_FOUND: 'User not found',
  USER_NOT_EXISTS: 'User not exists',
  USER_DELETED_SOFT: 'User deleted(soft)',
  USER_DELETED_HARD: 'User deleted(hard)',
  ERROR_SIGNING_USER: 'Error signing user ',
  ERROR_UPDATING_USER: 'Error updating user ',
  ERROR_DELETING_USER: 'Error deleting user',
  ERROR_UPDATING_PROFILE: 'Error updating profile',
  ERROR_CREATING_USER: 'Error creating user',
  ERROR_LISTING_USERS: 'Error listing users',
  INVALID_AGE: 'Age must be 12 years old',
  INVALID_PASSWORD: 'Invalid Password',
  ERROR_LISTING_USER: 'Error listing user',
  ERROR_COUNTING_USERS: 'Error counting users',
  NO_ACTIVE_USERS_FOUND: 'No active users found',

  // Admin Messages
  ADMIN_NOT_FOUND: 'Admin not found ',
  ERROR_UPDATING_ADMIN: 'Error while updating admin',

  // Book Messages
  BOOK_NOT_FOUND: 'Book not found',
  BOOK_ALREADY_EXISTS: 'Book already exists',
  BOOK_NOT_EXISTS: 'Book does not exists',
  BOOK_DELETED_SOFT: 'Book deleted(Soft)',
  BOOK_DELETED_HARD: 'Book deleted(Hard)',
  BOOK_OUT_OF_STOCK: 'Book out of stock',
  BOOK_LIMIT_EXCEEDED: 'User cannot have more than 5 books issued',
  BOOK_NOT_ISSUED: 'Book is not issued to this user',
  ERROR_CREATING_BOOK: 'Error creating book',
  ERROR_LISTING_BOOK: 'Error listing book',
  ERROR_UPDATING_BOOK: 'Error updating book',
  ERROR_DELETING_BOOK: 'Error deleting book',
  BOOK_HISTORY_NOT_FOUND: 'Book history not found',
  NO_ISSUED_BOOK_FOUND: 'No issued books found',
  INVALID_PAGE_NUMBER: 'Page number must be less than total pages',
  CANNOT_ISSUE_SAME_BOOK: 'User cannot issue the same book again',
  ERROR_COUNTING_BOOKS: 'Error while counting books',
  ERROR_LOGGING_HISTORY: 'Error logging history',
  NO_BOOKS_FOUND: 'No books found',

  // Book Issue/Return Messages
  SUBMIT_INVALID: 'submit date is invalid, kindly check',
  SUBMIT_DATE_INVALID: 'Submit date cannot be before to the issue date',
  OUTSTANDING_DUE_CHARGES:
    'User has outstanding due charges. Please clear them before issuing a book.',
  ISSUE_DATE_INVALID: 'Issue date should not be of past',
  ERROR_ASSIGNING_BOOK: 'Error assigning book',

  // Book Review/Rating Messages
  REVIEW_ALREADY_EXIST: 'Review done already',
  RATING_ALREADY_EXIST: 'Rating done already',
  NO_RATINGS_FOUND: 'No ratings found',
  NO_REVIEWS_FOUND: 'No reviews found',
  ERROR_CREATING_BOOK_REVIEW: 'Error while creating book review',
  ERROR_CREATING_BOOK_RATING: 'Error while creating book rating',
  ERROR_COUNTING_BOOK_HISTORY: 'Error while counting book history',

  // Authentication Messages
  INVALID_ACCESS_TOKEN: 'Invalid access token',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  INVALID_HEADER: 'Invalid header',
  INVALID_DATE_FORMAT: 'Invalid date format',
  INVALID_TOKEN_TYPE: 'Invalid token type',
  INVALID_RESET_TOKEN: 'Invalid reset token',
  INVALID_SUBMIT_DATE: 'Invalid submit date',

  // Payment Messages
  MISSING_PAYMENT_METHOD: 'Missing payment method',
  PAYMENT_SUCCESSFUL: 'Payment Successful',
  PAYMENT_FAILED: 'Payment Failed',
  MISSING_PAYMENT_CARD_DETAILS: 'Missing payment card details',
  PAYMENT_CARD_ADDED_SUCCESSFULLY: 'Payment card added successfully',
  ERROR_WHILE_ADDING_PAYMENT_CARD: 'Error while adding payment card',
  ERROR_WHILE_CREATING_STRIPE_CUSTOMER: 'Error while creating stripe customer',
  NO_PAYMENT_CARDS_FOUND: 'No payment cards found',
  PAYMENT_METHOD_NOT_FOUND: 'Payment method not found, kindly create new one',
  INVALID_CARD_CREDENTIALS: 'Invalid card credentials',
  ERROR_UPDATING_DUE_CHARGES_IN_USER: 'Error while updating due charges in user',
  MINIMUM_CHARGE_INVALID: 'Minimum charge amount is ₹0.50.',

  // File Upload Messages
  FILE_NOT_UPLOADED: 'File not uploaded',
  ERROR_UPLOAD_FILE: 'Error while uploading file',

  // Payment Template Messages
  ERROR_ADD_PAYMENT_CARD_TEMPLATE: 'Error in add payment card template'
}
