
// Utility functions for handling and displaying user-friendly error messages

export const parseApiError = (error) => {
  try {
    // If error is already a string, try to parse it as JSON
    let errorData = error;
    if (typeof error === 'string') {
      errorData = JSON.parse(error);
    }

    // Handle validation errors (like the one in the screenshot)
    if (errorData.type === 'value_error' && errorData.loc && errorData.msg) {
      const field = Array.isArray(errorData.loc) ? errorData.loc[0] : errorData.loc;
      
      // Map field-specific validation errors to user-friendly messages
      switch (field) {
        case 'email':
          if (errorData.msg.includes('valid email') || errorData.msg.includes('period')) {
            return 'Please enter a valid email address (e.g., user@example.com)';
          }
          return 'Please check your email address format';
          
        case 'password':
          if (errorData.msg.includes('too short')) {
            return 'Password must be at least 8 characters long';
          }
          if (errorData.msg.includes('weak')) {
            return 'Please choose a stronger password';
          }
          return 'Please check your password requirements';
          
        default:
          return `Please check the ${field} field`;
      }
    }

    // Handle other common error formats
    if (errorData.message) {
      return makeUserFriendly(errorData.message);
    }

    if (errorData.error) {
      return makeUserFriendly(errorData.error);
    }

    // If it's an array of errors, handle the first one
    if (Array.isArray(errorData) && errorData.length > 0) {
      return parseApiError(errorData[0]);
    }

    // Fallback for unknown error structures
    return makeUserFriendly(JSON.stringify(errorData));

  } catch (parseError) {
    // If we can't parse the error, make the original error user-friendly
    return makeUserFriendly(error.toString());
  }
};

const makeUserFriendly = (technicalMessage) => {
  const message = technicalMessage.toLowerCase();

  // Common technical messages and their user-friendly equivalents
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Please log in to continue.';
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return 'You don\'t have permission to perform this action.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'The requested information could not be found.';
  }

  if (message.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }

  if (message.includes('duplicate') || message.includes('already exists')) {
    return 'This information already exists. Please use different details.';
  }

  if (message.includes('required')) {
    return 'Please fill in all required fields.';
  }

  if (message.includes('invalid')) {
    return 'Please check the information you entered.';
  }

  if (message.includes('server error') || message.includes('500')) {
    return 'Something went wrong on our end. Please try again in a moment.';
  }

  // If no specific pattern matches, return a generic friendly message
  return 'Something went wrong. Please check your information and try again.';
};

/**
 * Enhanced error handling specifically for policy operations
 */
export const displayError = (error, context = {}) => {
  // Default context messages
  const defaultContext = {
    title: "An error occurred",
    general: "Something went wrong. Please try again.",
    network: "Network connection failed. Please check your internet connection.",
    validation: "Please check your input and try again.",
    permission: "You don't have permission to perform this action."
  };

  const ctx = { ...defaultContext, ...context };

  // Handle network errors
  if (error.message && (error.message.includes('Network Error') || error.message.includes('Failed to fetch'))) {
    return ctx.network;
  }

  // Handle permission/authorization errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return ctx.permission;
  }

  // Handle validation errors (400 status)
  if (error.response?.status === 400) {
    // Try to extract specific validation message
    const responseData = error.response?.data;
    if (typeof responseData === 'string') {
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.msg || parsed.message) {
          return parsed.msg || parsed.message;
        }
      } catch (e) {
        // If parsing fails, continue to other checks
      }
    }
    
    if (responseData?.msg || responseData?.message) {
      return responseData.msg || responseData.message;
    }
    
    return ctx.validation;
  }

  // Handle server errors (500 status)
  if (error.response?.status >= 500) {
    return "Server error occurred. Please try again later or contact support if the problem persists.";
  }

  // Try to extract a meaningful message from the error
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.msg) return parsed.msg;
        if (parsed.message) return parsed.message;
        if (parsed.error) return parsed.error;
      } catch (e) {
        // If parsing fails, return the string itself if it looks like a user message
        if (data.length < 200 && !data.includes('{') && !data.includes('Error:')) {
          return data;
        }
      }
    } else if (data.msg || data.message || data.error) {
      return data.msg || data.message || data.error;
    }
  }

  // If error has a message that looks user-friendly
  if (error.message && error.message.length < 100 && !error.message.includes('TypeError') && !error.message.includes('ReferenceError')) {
    return error.message;
  }

  // Fallback to general message
  return ctx.general;
};
