# Reset Password Page

This page handles password reset functionality for users who have forgotten their passwords.

## URL Format

The reset password page expects a URL in this format:
```
https://sentinelnext3.com/reset-password?token={reset_token}
```

Where `{reset_token}` is the JWT token sent to the user's email.

## Features

- **Token Validation**: Extracts and validates the reset token from the URL query parameters
- **Password Form**: Two input fields for new password and password confirmation
- **Validation**: 
  - Password must be at least 6 characters long
  - Passwords must match
  - Token must be present and valid
- **Error Handling**: Displays appropriate error messages for various failure scenarios
- **Success Flow**: Shows success message and redirects to login page after successful password reset
- **Loading States**: Shows loading spinner during API calls
- **Responsive Design**: Works on both desktop and mobile devices

## API Integration

The page integrates with the backend `/auth/reset-password` endpoint:

- **Method**: POST
- **Body**: 
  ```json
  {
    "token": "reset_token_from_url",
    "new_password": "user_new_password"
  }
  ```

## Mock Data Support

When `NEXT_PUBLIC_USE_MOCK_DATA=true`, the page uses the mock API endpoint at `/api/reset-password` for testing purposes.

## User Experience

1. User clicks reset password link from email
2. Page validates the token from URL
3. User enters new password and confirmation
4. Form validates input and submits to backend
5. On success, user sees confirmation and is redirected to login
6. On error, user sees specific error message and can retry

## Security Features

- Token validation before allowing password reset
- Password confirmation to prevent typos
- Minimum password length requirement
- Secure form submission with proper headers
- Automatic redirect after successful reset
