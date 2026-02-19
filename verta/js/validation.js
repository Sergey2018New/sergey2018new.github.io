
// Is valid phone
const isValidPhone = (phone) => {
    const validRegex = /^((8|\+7)[\- ]?)?(\(?\d{3,4}\)?[\- ]?)?[\d\- ]{10,10}$/;
    return validRegex.test(phone);
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/gi;

const options = {
    errorFieldCssClass: 'is-error',
    errorLabelStyle: false,
    errorLabelCssClass: 'error-message',
}

const errorMessages = {
    required: 'Заполните обязательное поле',
    required_all: 'Заполните все обязательные поля',
    email: 'Укажите корректный email',
    phone: 'Укажите корректный телефон',
    repeatPassword: 'Пароли должны совпадать',
}

const defaultAllFieldOptions = {
    rule: 'required',
    errorMessage: errorMessages.required_all,
};

const defaultFieldOptions = {
    rule: 'required',
    errorMessage: errorMessages.required,
};

const emailFieldOptions = {
    rule: 'customRegexp',
    value: emailRegex,
    errorMessage: errorMessages.email,
};

const phoneFieldOptions = {
    // rule: 'customRegexp',
    // value: emailRegex,
    rule: 'minLength',
    value: 18,
    errorMessage: errorMessages.phone,
};

const repeatPasswordFieldOptions = (passwordField) => {
    return {
        validator: (value, fields) => {
            if (passwordField) {
                const repeatPasswordValue = passwordField.value;

                return value === repeatPasswordValue;
            }

            return true;
        },
        errorMessage: errorMessages.repeatPassword,
    }
};

const validateForm = (formEl) => {
    const validate = formEl.validate = new window.JustValidate(formEl, options);
    const formChangeInputs = formEl.querySelectorAll('.js-validate-change-input');
    let formTouched = false;

    const addFieldsValidation = (isHiddenFields) => {
        let formFields = formEl.querySelectorAll('.js-validate-field');

        if (isHiddenFields) {
            formFields = formEl.querySelectorAll('.js-validate-field-is-hidden');
        }

        for (let index = 0; index < formFields.length; index += 1) {
            const field = formFields[index];
            let fieldOptions = [defaultFieldOptions];

            if (!field.classList.contains('js-validate-field-is-hidden.u-hidden') && !field.closest('.u-hidden')) {
                if (field.classList.contains('js-validate-field-email')) {
                    fieldOptions = [
                        defaultFieldOptions,
                        emailFieldOptions
                    ];
                }

                // if (field.classList.contains('js-validate-field-phone')) {
                //     fieldOptions = [
                //         defaultFieldOptions,
                //         phoneFieldOptions
                //     ];

                //     IMask(field, {
                //         mask: '+{7} (000) 000-00-00',
                //         // lazy: false,
                //     });
                // }

                const container = field.closest('.js-validate-field-wrapper')?.querySelector('.js-validate-field-error');
                validate.addField(field, fieldOptions, {
                      errorFieldCssClass: '',
                        successFieldCssClass: '',
                    errorsContainer: container || field,
                });

                field.isValidate = true;
            }

        }
    };

    const removeHiddenFieldsValidation = () => {
        const formFields = formEl.querySelectorAll('.js-validate-field-is-hidden');

        for (let index = 0; index < formFields.length; index += 1) {
            const field = formFields[index];

            if (field.isValidate) {
                validate.removeField(field);
                field.isValidate = false;
            }
        }
    };

    formEl.addEventListener('submit', (e) => {
        formTouched = true;
    });

    addFieldsValidation();

    if (formChangeInputs.length) {
        formChangeInputs.forEach((input) => {
            input.addEventListener('change', (e) => {
                setTimeout(() => {
                    removeHiddenFieldsValidation();
                    addFieldsValidation(true);
                }, 10);
            });
        });
    }

    validate.onValidate((event) => {
        if (!formTouched) return;

         for (const fieldName in event.fields) {
            const f = event.fields[fieldName];
            const wrapper = f.elem.closest('.js-validate-field-wrapper');
            if (!wrapper) continue;

            if (!f.isValid) {
                wrapper.classList.add('is-invalid');
            } else {
                wrapper.classList.remove('is-invalid');
            }
        }
    });

    validate.onSuccess(() => {
        const submit = formEl.querySelector('[type="submit"]');

        formEl.classList.add('is-submitting');
        submit.classList.add('is-loading');

        setTimeout(() => {
            formTouched = false;

            formEl.reset();
            validate.refresh();
            formEl.querySelectorAll('.js-base-text-field, .js-checkbox').forEach((field) => {
                if (typeof field.reset === 'function') {
                    field.reset();
                }
            });
            formEl.classList.remove('is-submitting');

            submit.classList.remove('is-loading');
            submit.classList.add('is-disabled');
            submit.disabled = true;

            // open success modal
            window.openModal('#success-modal');
        }, 500);
    });
}

// Forms validation
const forms = document.querySelectorAll('.js-validate-form');

if (forms.length) {
    forms.forEach((form) => {
        validateForm(form);
    });
}
