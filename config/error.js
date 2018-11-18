'use strict';

class BillyError extends Error {
    constructor (message, status) {
        super(message);
        
        // Saving class name in the property of our custom error as a shortcut.
        this.name = this.constructor.name;

        // Capturing stack trace, excluding constructor call from it.
        Error.captureStackTrace(this, this.constructor);
        
        // `500` is the default value if not specified.
        this.status = status || 500;
        this.message = message || "Algo ha ido mal.";
    }
};

class EmailTakenError extends BillyError {
    constructor (message) {
      super(message || 'El E-Mail entrado ya está siendo utilizado', 400);
    }
};

class DataBaseError extends BillyError {
    constructor (message) {
      // Providing default message and overriding status code.
      super(message || 'Error de base de datos', 500);
    }
};

class InfoRequiredError extends BillyError {
    constructor (message) {
      // Providing default message and overriding status code.
      super(message || 'Falta información', 422);
    }
};

class UnauthorizedError extends BillyError {
    constructor (message) {
      super(message || 'No autorizado', 400);
    }
};

class CredentialsError extends BillyError {
    constructor (message) {
      // Providing default message and overriding status code.
      super(message || 'Credenciales invalidas', 400);
    }
};

module.exports = {EmailTakenError,DataBaseError,InfoRequiredError,UnauthorizedError,CredentialsError};