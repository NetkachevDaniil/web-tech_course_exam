// API конфигурация
const API_KEY = '3926b07f-7ce7-4d7b-a716-3f472e11282f';
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';

// Общая функция для API запросов
async function makeApiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}?api_key=${API_KEY}`;
    const options = {
        method,
        headers: {
            'Accept': 'application/json',
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        showNotification(`Ошибка API: ${error.message}`, 'danger');
        throw error;
    }
}

// Функции для курсов
async function fetchCourses() {
    return await makeApiRequest('/api/courses');
}

async function fetchCourseById(id) {
    return await makeApiRequest(`/api/courses/${id}`);
}

// Функции для репетиторов
async function fetchTutors() {
    return await makeApiRequest('/api/tutors');
}

async function fetchTutorById(id) {
    return await makeApiRequest(`/api/tutors/${id}`);
}

// Функции для заявок
async function fetchOrders() {
    return await makeApiRequest('/api/orders');
}

async function createOrder(orderData) {
    return await makeApiRequest('/api/orders', 'POST', orderData);
}

async function updateOrder(orderId, orderData) {
    return await makeApiRequest(`/api/orders/${orderId}`, 'PUT', orderData);
}

async function deleteOrder(orderId) {
    return await makeApiRequest(`/api/orders/${orderId}`, 'DELETE');
}

async function fetchOrderById(orderId) {
    return await makeApiRequest(`/api/orders/${orderId}`);
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        const newNotificationArea = document.createElement('div');
        newNotificationArea.id = 'notification-area';
        newNotificationArea.className = 'container mt-5 pt-5';
        document.body.insertBefore(newNotificationArea, document.body.firstChild);
    }
    
    const finalNotificationArea = document.getElementById('notification-area');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    finalNotificationArea.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

// Функция для форматирования даты
function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Функция для форматирования времени
function formatTime(timeString) {
    if (!timeString) return 'Не указано';
    return timeString.substring(0, 5);
}

// Функция для пагинации
function paginate(items, pageNumber, itemsPerPage = 6) {
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
}

// Экспорт функций
window.api = {
    fetchCourses,
    fetchCourseById,
    fetchTutors,
    fetchTutorById,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    fetchOrderById,
    showNotification,
    formatDate,
    formatTime,
    paginate,
    API_KEY,
    API_BASE_URL
};
