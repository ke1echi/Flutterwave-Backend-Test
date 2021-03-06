const {
  JSONDetailsValidator
} = require('../helpers');


// validate-rule API controller
exports.validateController = (req, res) => {
  // Validate JSON payload
  const JSONDetailsValidationResponse = validateJSONDetailsHelper(req.body);

  if (JSONDetailsValidationResponse === true) {
    const { rule, data } = req.body;

    if (rule.field.includes('.')) {
      const splitFields = rule.field.split('.');
      
      if (!data.hasOwnProperty(`${splitFields[0]}`)) {
        return res.status(400).json({
          message: `field ${splitFields[0]} is missing from data.`,
          status: "error",
          data: null
        });
      } else {
        if (!data[`${splitFields[0]}`].hasOwnProperty(`${splitFields[1]}`)) {
          return res.status(400).json({
            message: `field ${rule.field} is missing from data.`,
            status: "error",
            data: null
          });
        } else {

          const { field, condition, condition_value } = rule;
          const checkerResponse = isValidCheckHelper(condition, condition_value, data[`${splitFields[0]}`], `${splitFields[1]}`);

          if (checkerResponse['data']['validation']['error']) {
            return res.status(400).json(checkerResponse);
          }

          if (!checkerResponse['data']['validation']['error']) {
            return res.status(200).json(checkerResponse);
          }

        }
      }
    }

    if (!data.hasOwnProperty(rule.field)) {
      return res.status(400).json({
        message: `field ${rule.field} is missing from data.`,
        status: "error",
        data: null
      });
    }

    const { field, condition, condition_value } = rule;
    const checkerResponse = isValidCheckHelper(condition, condition_value, data, field);

    if (checkerResponse['data']['validation']['error']) {
      return res.status(400).json(checkerResponse);
    }

    if (!checkerResponse['data']['validation']['error']) {
      return res.status(200).json(checkerResponse);
    }

  } else {
    return res.status(400).json(JSONDetailsValidationResponse);
  }
  
};


// Helper function
const validateJSONDetailsHelper = (payload) => {
  const { error } = JSONDetailsValidator.validate(payload);

  if (!error) {
    return true;
  }

  if (error.details[0].context.type === "object") {
    return {
      message: `${error.details[0].path[0]} should be an object.`,
      status: "error",
      data: null
    };
  }

  if (error.details[0].type === "any.required") {
    return {
      message: `${error.details[0].path[0]} is required.`,
      status: "error",
      data: null
    };
  } 

  if (error.details[0].type === "alternatives.types") {
    return {
      message: `${error.details[0].path[0]} should be a|an [${error.details[0].context.types}].`,
      status: "error",
      data: null
    };
  }

};


const isValidCheckHelper = (condition, condition_value, data, field) => {
  // Validation check
  if (condition === "gte" && data[`${field}`] >= condition_value) {
    const successResponse = successResponseHelper(condition, condition_value, field);
    return successResponse;
  }

  if (condition === "eq" && data[`${field}`] === condition_value) {
    const successResponse = successResponseHelper(condition, condition_value, field);
    return successResponse;
  }

  if (condition === "gt" && data[`${field}`] > condition_value) {
    const successResponse = successResponseHelper(condition, condition_value, field);
    return successResponse;
  }

  if (condition === "neq" && data[`${field}`] < condition_value) {
    const successResponse = successResponseHelper(condition, condition_value, field);
    return successResponse;
  }


  if (condition === "contains" && data.includes(condition_value)) {
    const successResponse = successResponseHelper(condition, condition_value, field);
    return successResponse;
  } else {
    // Failed condition response
    const errorResponse = errorResponseHelper(condition, condition_value, field);
    return errorResponse;
  }
};


const successResponseHelper = (condition, condition_value, field) => {
  return {
    message: `field ${field} successfully validated.`,
    status: "success",
    data: {
      validation: {
        error: false,
        field: `${field}`,
        field_value: `${condition_value}`,
        condition: `${condition}`,
        condition_value: `${condition_value}`
      }
    }
  };
};


const errorResponseHelper = (condition, condition_value, field) => {
  return {
    message: `field ${field} failed validation.`,
    status: "error",
    data: {
      validation: {
        error: true,
        field: `${field}`,
        field_value: `${condition_value}`,
        condition: `${condition}`,
        condition_value: `${condition_value}`
      }
    }
  };
}