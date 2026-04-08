
// Is valid phone
const isValidPhone = (phone) => {
    const validRegex = /^((8|\+7)[\- ]?)?(\(?\d{3,4}\)?[\- ]?)?[\d\- ]{10,10}$/;
    return validRegex.test(phone);
};

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/gi;

const options = {
    errorFieldCssClass: 'is-error',
    errorLabelStyle: false,
    errorLabelCssClass: 'label-error',
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

                if (field.classList.contains('js-validate-field-phone')) {
                    fieldOptions = [
                        defaultFieldOptions,
                        phoneFieldOptions
                    ];

                    IMask(field, {
                        mask: '+{7} (000) 000-00-00',
                        // lazy: false,
                    });
                }

                if (field.classList.contains('js-validate-field-repeat-password')) {
                    fieldOptions = [
                        defaultFieldOptions,
                        repeatPasswordFieldOptions(formEl.querySelector('.js-validate-field-password'))
                    ];
                }

                if (field.classList.contains('js-validate-field-password')) {
                    fieldOptions = [
                        defaultFieldOptions,
                        repeatPasswordFieldOptions(formEl.querySelector('.js-validate-field-repeat-password'))
                    ];
                }

                validate.addField(field, fieldOptions);

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

    validate.onSuccess(() => {
        console.log('success')
        // modal.open('#modal_success');
    });
}

// Forms validation
const forms = document.querySelectorAll('.js-form-validation');

if (forms.length) {
    forms.forEach((form) => {
        validateForm(form);
    });
}


// Subscription form validation
const formSubscribe = document.querySelector('.js-subscribe-form');

if (formSubscribe) {
    const formSubscribeEmail = formSubscribe.querySelector('.js-subscribe-email');
    const formSubscribeValidate = new window.JustValidate(formSubscribe, options);

    if (formSubscribeEmail) {
        formSubscribeValidate.addField(formSubscribeEmail, [
            defaultFieldOptions,
            emailFieldOptions
        ]);

        formSubscribeEmail.addEventListener('input', (e) => {
            if (e.target.value.trim().length > 0) {
                formSubscribeEmail.classList.add('is-filed');
            } else {
                formSubscribeEmail.classList.remove('is-filed');
            }
        });
    }

    formSubscribeValidate.onSuccess(() => {
        window.openNotify({
            status: 'info',
            speed: 350,
            type: 'filled',
            showIcon: false,
            text: 'Вы успешно подписались на новости',
            autotimeout: 5000,
        })

        formSubscribeEmail.value = '';
        formSubscribeEmail.classList.remove('is-filed');
    });
}

// Recovery form validation
const recoveryForm = document.querySelector('.js-recovery-form');

if (recoveryForm) {
    const recoveryFormEmail = recoveryForm.querySelector('.js-recovery-form-email');
    const recoveryFormResend = recoveryForm.querySelector('.js-recovery-form-resend');
    const recoveryFormValidate = new window.JustValidate(recoveryForm, options);

    if (recoveryFormEmail) {
        recoveryFormValidate.addField(recoveryFormEmail, [
            defaultFieldOptions,
            emailFieldOptions
        ]);
    }


    if (recoveryFormResend) {
        recoveryFormResend.addEventListener('click', () => {
            recoveryForm.classList.remove('is-submitted');
        });
    }

    recoveryFormValidate.onSuccess(() => {
        recoveryForm.classList.add('is-submitted');
    });
}

// New appeal form validation
const newAppealForm = document.querySelector('.js-form-new-appeal');

if (newAppealForm) {
    const newAppealFormCategory = newAppealForm.querySelector('.js-form-appeal-category');

    if (newAppealFormCategory) {
        newAppealFormCategory.addEventListener('change', (e) => {
            const attachFileEl = newAppealForm.querySelector('.js-form-appeal-attach-file');
            const attachesEl = newAppealForm.querySelector('.js-form-appeal-attaches');
            const reasonEl = newAppealForm.querySelector('.js-form-appeal-reason');
            const reasonOrder = newAppealForm.querySelector('.js-form-appeal-order');

            if (e.target.value === 'return') {
                attachFileEl.classList.add('u-hidden');
                attachesEl.classList.remove('u-hidden');
                reasonEl.classList.remove('u-hidden');
                reasonOrder.classList.remove('u-hidden');
            } else {
                attachFileEl.classList.remove('u-hidden');
                attachesEl.classList.add('u-hidden');
                reasonEl.classList.add('u-hidden');
                reasonOrder.classList.add('u-hidden');
            }
        });
    }
}

// Account password form
const changePasswordForm = document.querySelector('.js-change-password-form');

if (changePasswordForm) {
    const allFields = changePasswordForm.querySelectorAll('.js-validate-field');
    const currentPassword = changePasswordForm.querySelector('.js-current-password-field');
    const newPassword = changePasswordForm.querySelector('.js-new-password-field');
    const repeatPassword = changePasswordForm.querySelector('.js-repeat-password-field');
    const formSubmit = changePasswordForm.querySelector('.js-change-password-form-submit');
    const changePasswordFormValidate = new window.JustValidate(changePasswordForm, options);
    const changeVisibleSubmit = () => {
        if (formSubmit) {
            let isVisibleSubmit = false;

            for (let i = 0; i < allFields.length; i++) {
                const field = allFields[i];

                if (field.value.trim().length) {
                    isVisibleSubmit = true;

                    break;
                }
            }


            if (isVisibleSubmit) {
                formSubmit.removeAttribute('disabled');
            } else {
                formSubmit.setAttribute('disabled', 'disabled');
            }
        }

    };
    const clearFields = () => {
        for (let i = 0; i < allFields.length; i++) {
            const field = allFields[i];
            field.value = '';
            field.closest('.js-field-box').classList.remove('is-filed');
        }
    };

    for (let i = 0; i < allFields.length; i++) {
        const field = allFields[i];

        field.addEventListener('input', () => {
            changeVisibleSubmit();
        });
    }

    if (currentPassword) {
        changePasswordFormValidate.addField(currentPassword, [
            defaultFieldOptions,
        ]);
    }

    if (newPassword && repeatPassword) {
        changePasswordFormValidate.addField(newPassword, [
            defaultFieldOptions,
            repeatPasswordFieldOptions(repeatPassword)
        ]);

        changePasswordFormValidate.addField(repeatPassword, [
            defaultFieldOptions,
            repeatPasswordFieldOptions(newPassword)
        ]);

        newPassword.addEventListener('input', () => {
            if (newPassword.value === repeatPassword.value) {
                changePasswordFormValidate.revalidateField(repeatPassword);
            }
        });

        repeatPassword.addEventListener('input', () => {
            if (newPassword.value === repeatPassword.value) {
                changePasswordFormValidate.revalidateField(newPassword);
            }
        });
    }

    changePasswordFormValidate.onSuccess(() => {
        clearFields();
        changeVisibleSubmit();
        window.openNotify({
            status: 'info',
            speed: 350,
            type: 'filled',
            showIcon: false,
            text: 'Пароль успешно изменен',
            autotimeout: 5000,
        })
    });
}
