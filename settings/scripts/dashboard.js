// js/dashboard.js
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
        } catch (error) {
            console.error('Initialization error:', error);
            api.showNotification('Ошибка загрузки данных', 'danger');
        }
    }
    
    async function loadOrders() {
        try {
            allOrders = await api.fetchOrders();
            updateOrdersCount();
            renderOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
            const tbody = document.getElementById('orders-body');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-5">
                            <div class="alert alert-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Ошибка загрузки заявок. Пожалуйста, проверьте подключение к интернету и обновите страницу.
                            </div>
                        </td>
                    </tr>
                `;
            }
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
    
    function updateOrdersCount() {
        const countElement = document.getElementById('total-orders-count');
        if (countElement) {
            const count = allOrders.length;
            countElement.textContent = `${count} ${getOrdersCountText(count)}`;
        }
    }
    
    function getOrdersCountText(count) {
        if (count === 1) return 'заявка';
        if (count >= 2 && count <= 4) return 'заявки';
        return 'заявок';
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
        
        // Если нет заявок
        if (allOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <div class="bg-light p-4 rounded-3">
                            <i class="bi bi-file-earmark-text display-1 text-muted mb-3"></i>
                            <h4 class="text-muted mb-3">У вас пока нет заявок</h4>
                            <p class="text-muted mb-4">Чтобы создать первую заявку, перейдите на <a href="index.html" class="text-primary text-decoration-none">главную страницу</a> и выберите курс или репетитора.</p>
                            <a href="index.html" class="btn btn-primary px-4 py-2">
                                <i class="bi bi-house-door me-2"></i>Перейти на главную
                            </a>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('orders-pagination').innerHTML = '';
            return;
        }
        
        tbody.innerHTML = '';
        
        paginatedOrders.forEach((order, index) => {
            const row = createOrderRow(order, index);
            tbody.appendChild(row);
        });
        
        renderOrdersPagination();
    }
    
    function createOrderRow(order, index) {
        const row = document.createElement('tr');
        row.className = 'fade-in-up';
        row.style.animationDelay = `${index * 0.1}s`;
        
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
        statusDate.setHours(0, 0, 0, 0);
        
        let status = '';
        let statusClass = '';
        let statusIcon = '';
        
        if (statusDate > today) {
            status = 'Предстоящий';
            statusClass = 'badge bg-warning text-dark';
            statusIcon = 'bi bi-clock';
        } else if (statusDate.getTime() === today.getTime()) {
            status = 'Сегодня';
            statusClass = 'badge bg-info';
            statusIcon = 'bi bi-calendar-check';
        } else {
            status = 'Завершен';
            statusClass = 'badge bg-secondary';
            statusIcon = 'bi bi-check-circle';
        }
        
        row.innerHTML = `
            <td class="fw-bold">${globalIndex}</td>
            <td>
                <div class="fw-bold">${itemType}: ${itemName}</div>
                <small class="text-muted">${order.course_id > 0 ? 'Групповой курс' : 'Индивидуальное занятие'}</small>
            </td>
            <td>
                <div class="fw-semibold">${api.formatDate(order.date_start)}</div>
                <small class="text-muted">${api.formatTime(order.time_start)}</small>
            </td>
            <td class="fw-semibold">${order.time_start}</td>
            <td class="fw-bold">${order.persons}</td>
            <td class="fw-bold text-primary">${order.price.toLocaleString()} руб</td>
            <td>
                <span class="${statusClass} p-2 rounded">
                    <i class="${statusIcon} me-1"></i>${status}
                </span>
            </td>
            <td>
                <div class="d-flex flex-column flex-md-row gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary details-btn" data-order-id="${order.id}" title="Подробнее">
                        <i class="bi bi-info-circle"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-warning edit-btn" data-order-id="${order.id}" title="Изменить">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-btn" data-order-id="${order.id}" title="Удалить">
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
                        <i class="bi bi-chevron-left"></i> Предыдущая
                    </a>
                </li>
        `;
        
        // Показываем только часть страниц если их много
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentOrderPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${currentOrderPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                <li class="page-item ${currentOrderPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next">
                        Следующая <i class="bi bi-chevron-right"></i>
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
                
                // Плавная прокрутка к началу таблицы
                window.scrollTo({
                    top: document.querySelector('.card-header').offsetTop - 100,
                    behavior: 'smooth'
                });
            });
        });
    }
    
    function showOrderDetails(order) {
        const detailsContainer = document.getElementById('order-details');
        detailsContainer.innerHTML = '';
        
        // Находим связанный курс или репетитора
        let itemInfo = {};
        
        if (order.course_id > 0 && allCourses.length > 0) {
            const course = allCourses.find(c => c.id === order.course_id);
            if (course) {
                itemInfo = {
                    type: 'Курс',
                    name: course.name,
                    description: course.description,
                    teacher: course.teacher,
                    level: getLevelName(course.level),
                    total_length: course.total_length,
                    week_length: course.week_length,
                    course_fee_per_hour: course.course_fee_per_hour
                };
            }
        } else if (order.tutor_id > 0 && allTutors.length > 0) {
            const tutor = allTutors.find(t => t.id === order.tutor_id);
            if (tutor) {
                itemInfo = {
                    type: 'Репетитор',
                    name: tutor.name,
                    work_experience: tutor.work_experience,
                    languages_spoken: tutor.languages_spoken.map(lang => getLanguageName(lang)).join(', '),
                    languages_offered: tutor.languages_offered.map(lang => getLanguageName(lang)).join(', '),
                    language_level: getLevelName(tutor.language_level),
                    price_per_hour: tutor.price_per_hour
                };
            }
        }
        
        // Рассчитываем скидки/наценки
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
        
        // Форматируем дату окончания для курсов
        let endDate = '';
        if (itemInfo.total_length && itemInfo.total_length > 0) {
            const startDate = new Date(order.date_start);
            const endCourseDate = new Date(startDate);
            endCourseDate.setDate(startDate.getDate() + (itemInfo.total_length * 7));
            endDate = api.formatDate(endCourseDate.toISOString());
        }
        
        detailsContainer.innerHTML = `
            <div class="col-md-6 mb-4">
                <div class="card border-primary h-100">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0 fw-bold">Основная информация</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Тип</label>
                            <p class="mb-0 fs-5">${itemInfo.type || 'Неизвестно'}</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Название</label>
                            <p class="mb-0 fs-5 fw-bold text-primary">${itemInfo.name || 'Неизвестно'}</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Дата начала</label>
                            <p class="mb-0">${api.formatDate(order.date_start)}</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Время начала</label>
                            <p class="mb-0">${order.time_start}</p>
                        </div>
                        ${endDate ? `
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Дата окончания</label>
                            <p class="mb-0">${endDate}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-6 mb-4">
                <div class="card border-success h-100">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0 fw-bold">Финансовая информация</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Продолжительность</label>
                            <p class="mb-0">${order.duration} часов</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Количество студентов</label>
                            <p class="mb-0">${order.persons}</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Общая стоимость</label>
                            <p class="mb-0 fs-4 fw-bold text-success">${order.price.toLocaleString()} руб</p>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Дата создания</label>
                            <p class="mb-0">${formattedDate}</p>
                        </div>
                    </div>
                </div>
            </div>
            ${discountInfo.length > 0 ? `
            <div class="col-12 mb-4">
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0 fw-bold">Примененные скидки/наценки</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            ${discountInfo.map(item => `<li class="list-group-item">${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            ` : ''}
            ${itemInfo.description ? `
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0 fw-bold">Описание</h6>
                    </div>
                    <div class="card-body">
                        <p class="mb-0">${itemInfo.description}</p>
                    </div>
                </div>
            </div>
            ` : ''}
            ${itemInfo.teacher ? `
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0 fw-bold">Преподаватель</h6>
                    </div>
                    <div class="card-body">
                        <p class="mb-0 fw-semibold">${itemInfo.teacher}</p>
                    </div>
                </div>
            </div>
            ` : ''}
            ${itemInfo.level ? `
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0 fw-bold">Уровень</h6>
                    </div>
                    <div class="card-body">
                        <p class="mb-0">${itemInfo.level}</p>
                    </div>
                </div>
            </div>
            ` : ''}
        `;
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();
    }
    
    function getLevelName(level) {
        const levels = {
            'Beginner': 'Начальный',
            'Intermediate': 'Средний',
            'Advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }
    
    function getLanguageName(language) {
        const languages = {
            'Chinese': 'Китайский',
            'English': 'Английский',
            'Russian': 'Русский',
            'Spanish': 'Испанский',
            'German': 'Немецкий',
            'French': 'Французский',
            'Japanese': 'Японский',
            'Korean': 'Корейский'
        };
        return languages[language] || language;
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
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }
    
    function setupEventListeners() {
        // Обработчик сохранения изменений
        document.getElementById('save-edit')?.addEventListener('click', async () => {
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
                
                // Валидация данных
                if (persons < 1 || persons > 20) {
                    api.showNotification('Количество студентов должно быть от 1 до 20', 'warning');
                    return;
                }
                
                if (duration < 1) {
                    api.showNotification('Продолжительность должна быть больше 0', 'warning');
                    return;
                }
                
                // Показываем индикатор загрузки
                const saveBtn = document.getElementById('save-edit');
                const originalText = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Сохранение...';
                
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
                api.showNotification(`Ошибка при обновлении заявки: ${error.message}`, 'danger');
            } finally {
                // Восстанавливаем кнопку
                const saveBtn = document.getElementById('save-edit');
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        });
        
        // Обработчик удаления
        document.getElementById('confirm-delete')?.addEventListener('click', async () => {
            try {
                const orderId = document.getElementById('delete-order-id').value;
                
                // Показываем индикатор загрузки
                const deleteBtn = document.getElementById('confirm-delete');
                const originalText = deleteBtn.innerHTML;
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Удаление...';
                
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
                api.showNotification(`Ошибка при удалении заявки: ${error.message}`, 'danger');
            } finally {
                // Восстанавливаем кнопку
                const deleteBtn = document.getElementById('confirm-delete');
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = originalText;
            }
        });
    }
});
