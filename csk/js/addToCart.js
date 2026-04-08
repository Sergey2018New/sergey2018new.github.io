
document.addEventListener('click', (e) => {
    const target = e.target;

    const addToCartButton = target.classList.contains('js-add-to-cart-button') ? target : target.closest('.js-add-to-cart-button');
    const optionButton = target.classList.contains('js-modal-add-to-cart-option') ? target : target.closest('.js-modal-add-to-cart-option');

    const quickAddToCartSearchPopupActive = document.querySelector('.js-quick-add-to-cart-search-popup.is-visible');
    const quickAddToCartProduct = target.classList.contains('js-quick-add-to-cart-product') ? target : target.closest('.js-quick-add-to-cart-product');

    // add to cart button
    if (addToCartButton) {
        const modalAddToCart = addToCartButton.closest('.js-modal-add-to-cart');
        const addedToCartPopup = document.querySelector('.js-added-to-cart-popup');

        if (modalAddToCart) {
            const optionButtonActive = modalAddToCart.querySelector('.js-modal-add-to-cart-option.is-active');

            if (optionButtonActive) {
                document.documentElement.closeModal('.js-modal-add-to-cart');
            }
        }

        if (addedToCartPopup) {
            addedToCartPopup.classList.add('is-active');
        }
    }

    // add to cart in modal
    if (optionButton) {
        const modalAddToCart = optionButton.closest('.js-modal-add-to-cart');

        if (modalAddToCart) {
            const addToCartButton = modalAddToCart.querySelector('.js-add-to-cart-button');
            const optionButtonActive = modalAddToCart.querySelector('.js-modal-add-to-cart-option.is-active');

            if (optionButtonActive) {
                optionButtonActive.classList.remove('is-active');
            }

            optionButton.classList.add('is-active');

            if (addToCartButton) {
                addToCartButton.removeAttribute('disabled');
            }
        }
    }

    // quick add to cart
    if (quickAddToCartSearchPopupActive ) {
        const quickAddToCart = quickAddToCartSearchPopupActive.closest('.js-quick-add-to-cart');

        if (target !== quickAddToCart && !target.closest('.js-quick-add-to-cart')) {
            quickAddToCartSearchPopupActive.classList.remove('is-visible');
        }
    }
    if (quickAddToCartProduct) {
        e.preventDefault();

        const quickAddToCart = quickAddToCartProduct.closest('.js-quick-add-to-cart');

        if (quickAddToCart) {
            const quickAddToCartButton = quickAddToCart.querySelector('.js-quick-add-to-cart-button');
            const quickAddToCartInput = quickAddToCart.querySelector('.js-quick-add-to-cart-input');
            const quickAddToCartSearchPopup = quickAddToCartProduct.closest('.js-quick-add-to-cart-search-popup');
            const productTitle = quickAddToCartProduct.getAttribute('title');

            if (quickAddToCartButton) {
                quickAddToCartButton.removeAttribute('disabled');
            }

            if (quickAddToCartSearchPopup) {
                quickAddToCartSearchPopup.classList.remove('is-visible');
            }

            if (quickAddToCartInput && productTitle) {
                quickAddToCartInput.value = productTitle;
            }
        }
    }
});

document.addEventListener('input', (e) => {
    const target = e.target;
    const quickAddToCartInput = target.classList.contains('js-quick-add-to-cart-input') ? target : target.closest('.js-quick-add-to-cart-input');

    // quick add to cart
    if (quickAddToCartInput) {
        const quickAddToCart = quickAddToCartInput.closest('.js-quick-add-to-cart');

        if (quickAddToCart) {
            const quickAddToCartResultPopup = quickAddToCart.querySelector('.js-quick-add-to-cart-search-popup');

            if (quickAddToCartResultPopup) {
                if (quickAddToCartInput.value.trim().length > 1) {
                    quickAddToCartResultPopup.classList.add('is-visible');
                } else {
                    quickAddToCartResultPopup.classList.remove('is-visible');
                }
            }
        }
    }
});
