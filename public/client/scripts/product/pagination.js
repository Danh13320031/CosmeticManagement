const pageNumberList = document.querySelectorAll('.product__pagination-item.page__number');
const pagePrev = document.querySelector('.product__pagination-item.page__prev');
const pageNext = document.querySelector('.product__pagination-item.page__next');
const pageFirst = document.querySelector('.product__pagination-item.page__first');
const pageLast = document.querySelector('.product__pagination-item.page__last');

if (pageNumberList.length > 0) {
  pageNumberList.forEach((page) => {
    if (!page) return;

    page.addEventListener('click', (e) => {
      const url = new URL(window.location.href);
      const pageNumberItem = e.target.getAttribute('page-number');

      url.searchParams.set('page', pageNumberItem);
      window.location.href = url.href;
    });
  });
}

if (pagePrev) {
  pagePrev.addEventListener('click', () => {
    const url = new URL(window.location.href);
    let currentPage = Number.parseInt(url.searchParams.get('page'));

    if (currentPage <= 1) return;
    else currentPage = currentPage - 1;

    url.searchParams.set('page', currentPage);
    window.location.href = url.href;
  });
}

if (pageNext && pageNumberList.length > 0) {
  pageNext.addEventListener('click', (e) => {
    const url = new URL(window.location.href);
    let currentPage = Number.parseInt(url.searchParams.get('page'));

    if (currentPage >= pageNumberList.length) return;
    else currentPage = currentPage + 1;

    url.searchParams.set('page', currentPage || 2);
    window.location.href = url.href;
  });
}

if (pageFirst) {
  pageFirst.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 1);
    window.location.href = url.href;
  });
}

if (pageLast && pageNumberList.length > 0) {
  pageLast.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', pageNumberList.length);
    window.location.href = url.href;
  });
}
