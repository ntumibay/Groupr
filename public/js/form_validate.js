// In this file, you must perform all client-side validation for every single form input (and the role dropdown) on your pages. The constraints for those fields are the same as they are for the data functions and routes. Using client-side JS, you will intercept the form's submit event when the form is submitted and If there is an error in the user's input or they are missing fields, you will not allow the form to submit to the server and will display an error on the page to the user informing them of what was incorrect or missing.  You must do this for ALL fields for the register form as well as the login form. If the form being submitted has all valid data, then you will allow it to submit to the server for processing. Don't forget to check that password and confirm password match on the registration form!
document.addEventListener('DOMContentLoaded', function() {
    //register
    const registerForm = document.getElementById('signup-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearErrors();

            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const favoriteQuote = document.getElementById('favoriteQuote').value.trim();
            const backgroundColor = document.getElementById('backgroundColor').value;
            const fontColor = document.getElementById('fontColor').value;
            const role = document.getElementById('role').value;

            let isValid = true;

            if (!/^[a-zA-Z]{2,20}$/.test(firstName)) {
                isValid = false;
            }

            if (!/^[a-zA-Z]{2,20}$/.test(lastName)) {
                isValid = false;
            }

            if (!/^[a-zA-Z0-9]{5,10}$/.test(userId)) {
                isValid = false;
            }
z
            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[^\s]{8,}$/;
            if (!passwordRegex.test(password)) {
                isValid = false;
            }

            if (password !== confirmPassword) {
                isValid = false;
            }

            if (favoriteQuote.length < 20 || favoriteQuote.length > 255) {
                isValid = false;
            }

            if (!/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)) {
                isValid = false;
            }
            if (!/^#[0-9A-Fa-f]{6}$/.test(fontColor)) {
                isValid = false;
            }
            if (backgroundColor === fontColor) {
                isValid = false;
            }

            const hexRegex = /^#[0-9A-Fa-f]{6}$/i;
            if (!hexRegex.test(backgroundColor)) {
                showError('backgroundColor', 'Must be a valid hex color (#RRGGBB)');
                isValid = false;
            }
            if (!hexRegex.test(fontColor)) {
                showError('fontColor', 'Must be a valid hex color (#RRGGBB)');
                isValid = false;
            }

            if (!['superuser', 'user'].includes(role.toLowerCase())) {
                isValid = false;
            }

            if (isValid) {
                registerForm.submit();
            }
        });
    }

    //login
    const loginForm = document.getElementById('signin-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            let isValid = true;

            if (!/^[a-zA-Z0-9]{5,10}$/.test(userId)) {
                isValid = false;
            }

            const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[^\s]{8,}$/;
            if (!passwordRegex.test(password)) {
                isValid = false;
            }

            if (isValid) {
                loginForm.submit();
            }
        });
    }
});