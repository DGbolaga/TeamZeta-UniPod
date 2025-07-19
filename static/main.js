document.addEventListener('DOMContentLoaded', function() {
    const page = document.body.getAttribute('data-page');
    console.log('Loaded page:', page);

    // Fetch and display stuff.txt content
    fetch('/static/stuff.txt')
        .then(response => response.text())
        .then(data => {
            console.log('Contents of stuff.txt:', data);
        })
        .catch(err => console.error('Could not load stuff.txt:', err));

    // // Add a Next button if not present
    // if (!document.querySelector('.js-next-btn')) {
    //     const nextBtn = document.createElement('button');
    //     nextBtn.textContent = 'Next';
    //     nextBtn.className = 'js-next-btn';
    //     nextBtn.style.margin = '20px';
    //     document.body.appendChild(nextBtn);

    //     nextBtn.addEventListener('click', function() {
    //         // Go to the next page if possible
    //         let nextPage = parseInt(page, 10) + 1;
    //         if (nextPage <= 4) {
    //             window.location.href = `page${nextPage}.html`;
    //         } else {
    //             alert('No more steps!');
    //         }
    //     });
    // }
}); 