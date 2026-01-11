document.addEventListener('DOMContentLoaded', function() {
    let allOrders = [];
    let allCourses = [];
    let allTutors = [];
    let currentOrderPage = 1;
    const ordersPerPage = 5;
    
    // Инициализация
    init();
    
    async function init() {
        try {
            // Загрузка заказов
            await loadOrders();
            
            // Загрузка курсов и репетиторов для отображения названий
            await loadCoursesAndTutors();
            
            // Настройка обработчиков событий
            setupEventListeners();
            
            api.showNotification('Добро пожаловать в личный кабинет!', 'info');
            
        } catch (error) {
            console.error('Initialization error:', error);
            api.showNotification('Ошибка загрузки данных', 'danger');
        }
    }
    
    async function loadOrders() {
        try {
            allOrders = await api.fetchOrders();
            renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }
    
    async function loadCoursesAndTutors() {
        try {
            [allCourses, allTutors] = await Promise.all([
                api.fetchCourses(),
                api.fetchTutors()
            ]);
            renderOrders(); // Перерисовываем заказы с названиями
        } catch (error) {
            console.error('Error loading courses and tutors:', error);
        }
    }
    
    function renderOrders() {
        const tbody = document.getElementById('orders-body');
        if (!tbody) return;
        
        // Удаляем строку загрузки
        const loadingRow = document.getElementById('loading-row');
        if (loadingRow) {
            loadingRow.remove();
        }
        
        const paginatedOrders = api.paginate(allOrders, currentOrderPage, ordersPerPage);
        
        tbody.innerHTML = '';
        
        if (paginatedOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <h5>Заявок пока нет</h5>
                        <p>Перейдите на главную страницу, чтобы оставить первую заявку</p>
                        <a href="index.html" class="btn mt-3">
                            <i class="bi bi-house-door me-2"></i>На главную
                        </a>
                    </td>
                </tr>
            `;
            
            document.getElementById('orders-pagination').innerHTML = '';
            return;
        }
        
        paginatedOrders.forEach((order, index) => {
            const row = createOrderRow(order, index);
            tbody.appendChild(row);
        });
        
        renderOrdersPagination();
    }
    
    function createOrderRow(order, index) {
        const row = document.createElement('tr');
        const globalIndex = (currentOrderPage - 1) * ordersPerPage + index + 1;
        
        // Получаем название курса или репетитора
        let itemName = 'Неизвестно';
        let itemType = '';
        if (order.course_id > 0 && allCourses.length > 0) {
            const course = allCourses.find(c => c.id === order.course_id);
            if (course) {
                itemName = course.name;
                itemType = 'Курс';
            }
        } else if (order.tutor_id > 0 && allTutors.length > 0) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            if (tutor) {
                itemName = tutor.name;
                itemType = 'Репетитор';
            }
        }
        
        // Определяем статус
        const statusDate = new Date(order.date_start);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let status = '';
        let statusClass = '';
        
        if (statusDate > today) {
            status = 'Предстоящий';
            statusClass = 'badge bg-warning';
        } else if (statusDate.toDateString() === today.toDateString()) {
            status = 'Сегодня';
            statusClass = 'badge bg-info';
        } else {
            status = 'Завершен';
            statusClass = 'badge bg-secondary';
        }
        
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td>
                <strong>${itemType}:</strong> ${itemName}
            </td>
            <td>${api.formatDate(order.date_start)}</td>
            <td>${api.formatTime(order.time_start)}</td>
            <td>${order.persons}</td>
            <td>${order.price.toLocaleString()} руб</td>
            <td><span class="${statusClass}">${status}</span></td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary details-btn" data-order-id="${order.id}">
                        <i class="bi bi-info-circle"></i>
                    </button>
                    <button type="button" class="btn btn-outline-warning edit-btn" data-order-id="${order.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger delete-btn" data-order-id="${order.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Добавляем обработчики для кнопок
        row.querySelector('.details-btn').addEventListener('click', () => showOrderDetails(order));
        row.querySelector('.edit-btn').addEventListener('click', () => openEditModal(order));
        row.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(order));
        
        return row;
    }
    
    function renderOrdersPagination() {
        const pagination = document.getElementById('orders-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(allOrders.length / ordersPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <ul class="pagination">
                <li class="page-item ${currentOrderPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${currentOrderPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                <li class="page-item ${currentOrderPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next">
                        <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            </ul>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // Добавляем обработчики для пагинации
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                
                if (page === 'prev' && currentOrderPage > 1) {
                    currentOrderPage--;
                } else if (page === 'next' && currentOrderPage < totalPages) {
                    currentOrderPage++;
                } else if (!isNaN(page)) {
                    currentOrderPage = parseInt(page);
                }
                
                renderOrders();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });
    }
    
    function showOrderDetails(order) {
        const detailsContainer = document.getElementById('order-details');
        
        // Находим связанный курс или репетитора
        let itemInfo = {};
        let itemType = '';
        if (order.course_id > 0) {
            const course = allCourses.find(c => c.id === order.course_id);
            if (course) {
                itemType = 'Курс';
                itemInfo = {
                    type: 'Курс',
                    name: course.name,
                    description: course.description,
                    teacher: course.teacher,
                    level: course.level,
                    total_length: course.total_length,
                    week_length: course.week_length,
                    course_fee_per_hour: course.course_fee_per_hour
                };
            }
        } else if (order.tutor_id > 0) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            if (tutor) {
                itemType = 'Репетитор';
                itemInfo = {
                    type: 'Репетитор',
                    name: tutor.name,
                    work_experience: tutor.work_experience,
                    languages_spoken: tutor.languages_spoken.join(', '),
                    languages_offered: tutor.languages_offered.join(', '),
                    language_level: tutor.language_level,
                    price_per_hour: tutor.price_per_hour
                };
            }
        }
        
        // Рассчитываем скидки/надбавки
        let discountInfo = [];
        if (order.early_registration) discountInfo.push('Скидка за раннюю регистрацию: 10%');
        if (order.group_enrollment) discountInfo.push('Скидка за групповую запись: 15%');
        if (order.intensive_course) discountInfo.push('Наценка за интенсивный курс: 20%');
        if (order.supplementary) discountInfo.push('Дополнительные материалы: +2000 руб/студент');
        if (order.personalized) discountInfo.push('Индивидуальные занятия: +1500 руб/неделя');
        if (order.excursions) discountInfo.push('Культурные экскурсии: +25%');
        if (order.assessment) discountInfo.push('Оценка уровня: +300 руб');
        if (order.interactive) discountInfo.push('Интерактивная платформа: +50%');
        
        // Форматируем дату создания
        const createdAt = new Date(order.created_at);
        const formattedDate = createdAt.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        detailsContainer.innerHTML = `
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Тип</label>
                    <p>${itemType || 'Неизвестно'}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Название</label>
                    <p>${itemInfo.name || 'Неизвестно'}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Дата начала</label>
                    <p>${api.formatDate(order.date_start)}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Время начала</label>
                    <p>${api.formatTime(order.time_start)}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Продолжительность</label>
                    <p>${order.duration} часов</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Количество студентов</label>
                    <p>${order.persons}</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Общая стоимость</label>
                    <p class="fs-5 fw-bold">${order.price.toLocaleString()} руб</p>
                </div>
                <div class="mb-3">
                    <label class="form-label fw-bold">Дата создания</label>
                    <p>${formattedDate}</p>
                </div>
            </div>
            ${discountInfo.length > 0 ? `
                <div class="col-12">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="card-title">Примененные скидки/надбавки</h6>
                            <ul class="mb-0">
                                ${discountInfo.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${itemInfo.description ? `
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Описание</h6>
                            <p class="mb-0">${itemInfo.description}</p>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${itemInfo.course_fee_per_hour ? `
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Детали курса</h6>
                            <p><strong>Преподаватель:</strong> ${itemInfo.teacher}</p>
                            <p><strong>Уровень:</strong> ${itemInfo.level}</p>
                            <p><strong>Длительность:</strong> ${itemInfo.total_length} недель</p>
                            <p><strong>Часов в неделю:</strong> ${itemInfo.week_length}</p>
                            <p><strong>Ставка за час:</strong> ${itemInfo.course_fee_per_hour} руб</p>
                        </div>
                    </div>
                </div>
            ` : ''}
            ${itemInfo.price_per_hour ? `
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Детали репетитора</h6>
                            <p><strong>Опыт работы:</strong> ${itemInfo.work_experience} лет</p>
                            <p><strong>Уровень языка:</strong> ${itemInfo.language_level}</p>
                            <p><strong>Языки преподавания:</strong> ${itemInfo.languages_offered}</p>
                            <p><strong>Ставка за час:</strong> ${itemInfo.price_per_hour} руб</p>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    }
    
    function openEditModal(order) {
        // Заполняем форму данными заявки
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-date-start').value = order.date_start;
        document.getElementById('edit-time-start').value = order.time_start;
        document.getElementById('edit-persons').value = order.persons;
        document.getElementById('edit-duration').value = order.duration;
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }
    
    function openDeleteModal(order) {
        document.getElementById('delete-order-id').value = order.id;
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }
    
    function setupEventListeners() {
        // Обработчик сохранения изменений
        document.getElementById('save-edit').addEventListener('click', async () => {
            try {
                const orderId = document.getElementById('edit-order-id').value;
                const dateStart = document.getElementById('edit-date-start').value;
                const timeStart = document.getElementById('edit-time-start').value;
                const persons = parseInt(document.getElementById('edit-persons').value);
                const duration = parseInt(document.getElementById('edit-duration').value);
                
                if (!dateStart || !timeStart || !persons || !duration) {
                    api.showNotification('Заполните все поля', 'warning');
                    return;
                }
                
                // Собираем обновленные данные
                const updateData = {
                    date_start: dateStart,
                    time_start: timeStart,
                    persons: persons,
                    duration: duration
                };
                
                // Отправляем запрос на обновление
                await api.updateOrder(orderId, updateData);
                
                // Закрываем модальное окно
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                
                // Показываем уведомление
                api.showNotification('Заявка успешно обновлена!', 'success');
                
                // Обновляем список заявок
                await loadOrders();
                
            } catch (error) {
                console.error('Error updating order:', error);
                api.showNotification('Ошибка при обновлении заявки', 'danger');
            }
        });
        
        // Обработчик удаления
        document.getElementById('confirm-delete').addEventListener('click', async () => {
            try {
                const orderId = document.getElementById('delete-order-id').value;
                
                // Отправляем запрос на удаление
                await api.deleteOrder(orderId);
                
                // Закрываем модальное окно
                bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
                
                // Показываем уведомление
                api.showNotification('Заявка успешно удалена!', 'success');
                
                // Обновляем список заявок
                await loadOrders();
                
            } catch (error) {
                console.error('Error deleting order:', error);
                api.showNotification('Ошибка при удалении заявки', 'danger');
            }
        });
    }
});
