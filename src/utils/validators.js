/**
 * BENTORAH Form Validators
 */

/**
 * Validate the checkout form fields
 * @param {object} form - { firstName, lastName, email, phone, address, city, state }
 * @returns {object} errors - keyed by field name
 */
export const validateCheckoutForm = (form) => {
  const errors = {};

  if (!form.firstName?.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!form.lastName?.trim()) {
    errors.lastName = 'Last name is required.';
  }

  if (!form.email?.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!/^(\+?234|0)[789][01]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid Nigerian phone number.';
  }

  if (!form.address?.trim()) {
    errors.address = 'Street address is required.';
  }

  if (!form.city?.trim()) {
    errors.city = 'City is required.';
  }

  if (!form.state?.trim()) {
    errors.state = 'Please select a state.';
  }

  return errors;
};

/**
 * Validate an email address
 */
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate a Nigerian phone number
 */
export const isValidNigerianPhone = (phone) => {
  return /^(\+?234|0)[789][01]\d{8}$/.test(phone?.replace(/\s/g, ''));
};

/**
 * Check if a string is not empty
 */
export const isRequired = (value) => {
  return value != null && String(value).trim().length > 0;
};
