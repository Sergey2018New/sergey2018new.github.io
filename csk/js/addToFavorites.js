document.addEventListener('click', (e) => {
    const target = e.target;
    const addToFavoritesButton = target.classList.contains('js-add-to-favorites-button') ? target : target.closest('.js-add-to-favorites-button');

    if (addToFavoritesButton) {
        const addedToFavoritesPopup = document.querySelector('.js-added-to-favorites-popup');

        if (addedToFavoritesPopup) {
            addedToFavoritesPopup.classList.add('is-active');
        }
    }
});
