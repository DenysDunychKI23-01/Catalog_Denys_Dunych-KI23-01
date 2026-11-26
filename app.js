import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ijogdpaszhnfyldncfsd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BORlzIad-ftbAe2UjqYagA_V-p5zhAl';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Елементи DOM
const statusEl = document.querySelector('#status');
const listEl = document.querySelector('#products-list');
const searchInput = document.querySelector('#search-input');
const categoryFilter = document.querySelector('#category-filter');
const sortSelect = document.querySelector('#sort-select');

const productForm = document.querySelector('#product-form');
const nameInput = document.querySelector('#name');
const brandInput = document.querySelector('#brand');
const categoryInput = document.querySelector('#category');
const priceInput = document.querySelector('#price');
const submitBtn = document.querySelector('#submit-btn');

// Допоміжна функція для виведення статусу
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

// Завантаження записів із урахуванням пошуку, фільтрації та сортування
async function loadProducts() {
  setStatus('Завантаження даних із Supabase...');
  listEl.replaceChildren();

  const searchTerm = searchInput.value.trim();
  const selectedCategory = categoryFilter.value;
  const [sortField, sortDirection] = sortSelect.value.split('-');

  try {
    let query = db
      .from('products')
      .select('id, name, brand, category, price');

    // Фільтрація за категорією
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    // Пошук за назвою (без урахування регістру)
    if (searchTerm.length > 0) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    // Сортування
    query = query.order(sortField, { ascending: sortDirection === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('Помилка API Supabase:', error);
      setStatus(`Помилка завантаження: ${error.message}`, true);
      return;
    }

    if (!data || data.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = 'За вашим запитом записів не знайдено або таблиця порожня.';
      listEl.append(emptyItem);
      setStatus('Знайдено записів: 0');
      return;
    }

    // Безпечне відображення через textContent
    for (const product of data) {
      const li = document.createElement('li');
      li.className = 'product-item';

      const infoDiv = document.createElement('div');
      const titleStrong = document.createElement('strong');
      titleStrong.textContent = `${product.brand} ${product.name}`;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'product-meta';
      metaDiv.textContent = `Категорія: ${product.category}`;

      infoDiv.append(titleStrong, metaDiv);

      const priceSpan = document.createElement('span');
      priceSpan.className = 'product-price';
      priceSpan.textContent = `${Number(product.price).toLocaleString('uk-UA')} грн`;

      li.append(infoDiv, priceSpan);
      listEl.append(li);
    }

    setStatus(`Знайдено товарів: ${data.length}`);
  } catch (err) {
    console.error('Мережева помилка:', err);
    setStatus('Не вдалося з’єднатися із сервером Supabase. Перевірте інтернет.', true);
  }
}

// Додавання нового запису через форму
productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const brand = brandInput.value.trim();
  const category = categoryInput.value;
  const price = parseFloat(priceInput.value);

  // Валідація у JS
  if (!name || name.length > 150 || !brand || brand.length > 100 || isNaN(price) || price <= 0) {
    setStatus('Перевірте коректність заповнення всіх полів форми.', true);
    return;
  }

  submitBtn.disabled = true;
  setStatus('Збереження нового товару в базу даних...');

  try {
    const { error } = await db
      .from('products')
      .insert({ name, brand, category, price });

    if (error) {
      console.error('Помилка INSERT:', error);
      setStatus(`Не вдалося додати товар: ${error.message}`, true);
      return;
    }

    productForm.reset();
    await loadProducts();
    setStatus('Товар успішно додано до бази даних!');
  } catch (err) {
    console.error('Мережева помилка при додаванні:', err);
    setStatus('Помилка мережі. Перевірте підключення до інтернету.', true);
  } finally {
    submitBtn.disabled = false;
  }
});

// Слухачі подій для пошуку, фільтра та сортування
searchInput.addEventListener('input', loadProducts);
categoryFilter.addEventListener('change', loadProducts);
sortSelect.addEventListener('change', loadProducts);

// Початкове завантаження при відкритті сторінки
loadProducts();
