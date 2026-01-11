document.addEventListener('DOMContentLoaded', function() {
    // Текущие данные
    let allCourses = [];
    let allTutors = [];
    let currentCoursePage = 1;
    const coursesPerPage = 5;
    let selectedCourse = null;
    let selectedTutor = null;
    
    // Инициализация
    init();
    
    async function init() {
        try {
            // Загрузка курсов
            await loadCourses();
            
            // Загрузка репетиторов
            await loadTutors();
            
            // Настройка обработчиков событий
            setupEventListeners();
            
            api.showNotification('Добро пожаловать в школу китайского языка!', 'info');
            
        } catch (error) {
            console.error('Initialization error:', error);
            api.showNotification('Ошибка загрузки данных', 'danger');
        }
    }
    
    async function loadCourses() {
        try {
            allCourses = await api.fetchCourses();
            renderCourses();
            setupCourseSearch();
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }
    
    async function loadTutors() {
        try {
            allTutors = await api.fetchTutors();
            renderTutors();
            setupTutorSearch();
            populateTutorSelect();
        } catch (error) {
            console.error('Error loading tutors:', error);
        }
    }
    
    function renderCourses() {
        const container = document.getElementById('courses-container');
        if (!container) return;
        
        const filteredCourses = filterCourses();
        const paginatedCourses = api.paginate(filteredCourses, currentCoursePage, coursesPerPage);
        
        container.innerHTML = '';
        
        if (paginatedCourses.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-book display-1 text-muted mb-3"></i>
                    <h4>Курсы не найдены</h4>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
            document.getElementById('courses-pagination').innerHTML = '';
            return;
        }
        
        paginatedCourses.forEach(course => {
            const courseCard = createCourseCard(course);
            container.appendChild(courseCard);
        });
        
        renderPagination(filteredCourses.length);
    }
    
    function createCourseCard(course) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 fade-in';
        
        const totalHours = course.total_length * course.week_length;
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="mb-3">
                        <span class="badge bg-primary mb-2">${course.level}</span>
                        <h5 class="card-title">${course.name}</h5>
                        <p class="card-text text-muted" style="height: 60px; overflow: hidden; text-overflow: ellipsis;">
                            ${course.description}
                        </p>
                    </div>
                    
                    <div class="mt-auto">
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted">Преподаватель</small>
                                <div class="fw-semibold">${course.teacher}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Длительность</small>
                                <div class="fw-semibold">${course.total_length} недель</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Часов в неделю</small>
                                <div class="fw-semibold">${course.week_length}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Ставка за час</small>
                                <div class="fw-semibold">${course.course_fee_per_hour} руб</div>
                            </div>
                        </div>
                        
                        <button class="btn w-100 apply-course-btn" data-course-id="${course.id}">
                            Подать заявку
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчик для кнопки заявки
        col.querySelector('.apply-course-btn').addEventListener('click', () => {
            openCourseApplication(course);
        });
        
        return col;
    }
    
    function renderPagination(totalItems) {
        const pagination = document.getElementById('courses-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalItems / coursesPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <ul class="pagination">
                <li class="page-item ${currentCoursePage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev">
                        <i class="bi bi-chevron-left"></i>
                    </a>
                </li>
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${currentCoursePage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                <li class="page-item ${currentCoursePage === totalPages ? 'disabled' : ''}">
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
                
                if (page === 'prev' && currentCoursePage > 1) {
                    currentCoursePage--;
                } else if (page === 'next' && currentCoursePage < totalPages) {
                    currentCoursePage++;
                } else if (!isNaN(page)) {
                    currentCoursePage = parseInt(page);
                }
                
                renderCourses();
                window.scrollTo({
                    top: document.getElementById('courses').offsetTop - 100,
                    behavior: 'smooth'
                });
            });
        });
    }
    
    function filterCourses() {
        const searchName = document.getElementById('course-name').value.toLowerCase();
        const searchLevel = document.getElementById('course-level').value;
        
        return allCourses.filter(course => {
            const nameMatch = !searchName || course.name.toLowerCase().includes(searchName);
            const levelMatch = !searchLevel || course.level === searchLevel;
            return nameMatch && levelMatch;
        });
    }
    
    function setupCourseSearch() {
        const searchForm = document.getElementById('course-search-form');
        if (searchForm) {
            searchForm.addEventListener('input', () => {
                currentCoursePage = 1;
                renderCourses();
            });
        }
    }
    
    function renderTutors() {
        const tbody = document.getElementById('tutors-body');
        if (!tbody) return;
        
        const filteredTutors = filterTutors();
        
        tbody.innerHTML = '';
        
        if (filteredTutors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-person-x display-4 text-muted mb-3"></i>
                        <h5>Репетиторы не найдены</h5>
                        <p>Попробуйте изменить параметры поиска</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredTutors.forEach(tutor => {
            const row = createTutorRow(tutor);
            tbody.appendChild(row);
        });
    }
    
    function createTutorRow(tutor) {
        const row = document.createElement('tr');
        if (selectedTutor?.id === tutor.id) {
            row.classList.add('selected-tutor');
        }
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&size=40&rounded=true" 
                         alt="${tutor.name}" class="rounded-circle me-3">
                    <div>
                        <strong>${tutor.name}</strong>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${tutor.language_level}</span>
            </td>
            <td>
                ${tutor.languages_offered.map(lang => 
                    `<span class="badge bg-secondary me-1">${lang}</span>`
                ).join('')}
            </td>
            <td>${tutor.work_experience} лет</td>
            <td>${tutor.price_per_hour} руб/час</td>
            <td>
                <button class="btn btn-sm btn-outline-primary select-tutor-btn" data-tutor-id="${tutor.id}">
                    Выбрать
                </button>
                <button class="btn btn-sm btn-primary request-tutor-btn" data-tutor-id="${tutor.id}">
                    Записаться
                </button>
            </td>
        `;
        
        // Обработчик для кнопки выбора
        row.querySelector('.select-tutor-btn').addEventListener('click', () => {
            selectTutor(tutor);
        });
        
        // Обработчик для кнопки запроса
        row.querySelector('.request-tutor-btn').addEventListener('click', () => {
            openTutorRequest(tutor);
        });
        
        return row;
    }
    
    function filterTutors() {
        const language = document.getElementById('tutor-language').value;
        const level = document.getElementById('tutor-level').value;
        
        return allTutors.filter(tutor => {
            const languageMatch = !language || tutor.languages_offered.includes(language);
            const levelMatch = !level || tutor.language_level === level;
            return languageMatch && levelMatch;
        });
    }
    
    function setupTutorSearch() {
        const searchForm = document.getElementById('tutor-search-form');
        if (searchForm) {
            searchForm.addEventListener('input', () => {
                renderTutors();
            });
        }
        
        // Заполняем опции языков
        const languageSelect = document.getElementById('tutor-language');
        if (languageSelect) {
            const allLanguages = new Set();
            allTutors.forEach(tutor => {
                tutor.languages_offered.forEach(lang => allLanguages.add(lang));
            });
            
            allLanguages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang;
                languageSelect.appendChild(option);
            });
        }
    }
    
    function populateTutorSelect() {
        const select = document.getElementById('request-tutor-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите репетитора</option>';
        allTutors.forEach(tutor => {
            const option = document.createElement('option');
            option.value = tutor.id;
            option.textContent = `${tutor.name} - ${tutor.language_level} (${tutor.price_per_hour} руб/час)`;
            select.appendChild(option);
        });
    }
    
    function selectTutor(tutor) {
        selectedTutor = tutor;
        renderTutors(); // Перерисовываем таблицу для выделения выбранного репетитора
        
        api.showNotification(`Выбран репетитор: ${tutor.name}`, 'info');
    }
    
    function openCourseApplication(course) {
        selectedCourse = course;
        
        // Заполняем поля формы
        document.getElementById('modal-course-name').value = course.name;
        document.getElementById('modal-course-teacher').value = course.teacher;
        document.getElementById('modal-duration').value = course.total_length;
        document.getElementById('modal-total-hours').value = course.total_length * course.week_length;
        
        // Заполняем даты начала
        const dateSelect = document.getElementById('modal-start-date');
        dateSelect.innerHTML = '<option value="">Выберите дату начала</option>';
        
        const uniqueDates = [...new Set(course.start_dates.map(date => date.split('T')[0]))];
        uniqueDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = api.formatDate(dateStr);
            dateSelect.appendChild(option);
        });
        
        // Сбрасываем время и стоимость
        document.getElementById('modal-start-time').innerHTML = '<option value="">Сначала выберите дату</option>';
        document.getElementById('modal-start-time').disabled = true;
        
        // Сбрасываем дополнительные опции
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`).checked = false;
        });
        
        // Сбрасываем скидки
        document.getElementById('discount-info').style.display = 'none';
        
        // Пересчитываем стоимость
        calculateTotalPrice();
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('applyModal'));
        modal.show();
    }
    
    function setupEventListeners() {
        // Обработчик изменения даты в форме курса
        document.getElementById('modal-start-date').addEventListener('change', function() {
            const timeSelect = document.getElementById('modal-start-time');
            const date = this.value;
            
            if (!date || !selectedCourse) {
                timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
                timeSelect.disabled = true;
                return;
            }
            
            timeSelect.innerHTML = '<option value="">Выберите время начала</option>';
            
            // Фильтруем времена для выбранной даты
            const timesForDate = selectedCourse.start_dates
                .filter(dt => dt.startsWith(date))
                .map(dt => {
                    const timePart = dt.split('T')[1].substring(0, 5);
                    return timePart;
                });
            
            // Убираем дубликаты времени
            const uniqueTimes = [...new Set(timesForDate)];
            
            uniqueTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
            
            // Рассчитываем дату окончания
            if (selectedCourse) {
                const startDate = new Date(date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + (selectedCourse.total_length * 7));
                document.getElementById('modal-end-date').value = api.formatDate(endDate.toISOString());
            }
            
            calculateTotalPrice();
        });
        
        // Обработчик изменения времени
        document.getElementById('modal-start-time').addEventListener('change', calculateTotalPrice);
        
        // Обработчики изменения количества студентов и опций
        document.getElementById('modal-students').addEventListener('input', calculateTotalPrice);
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`).addEventListener('change', calculateTotalPrice);
        });
        
        // Обработчик отправки заявки на курс
        document.getElementById('submit-application').addEventListener('click', submitCourseApplication);
        
        // Обработчик отправки заявки на репетитора
        document.getElementById('submit-tutor-request').addEventListener('click', submitTutorRequest);
    }
    
    function calculateTotalPrice() {
        if (!selectedCourse) return;
        
        const course = selectedCourse;
        const students = parseInt(document.getElementById('modal-students').value) || 1;
        const startDate = document.getElementById('modal-start-date').value;
        const startTime = document.getElementById('modal-start-time').value;
        
        // Базовые параметры
        const courseFeePerHour = course.course_fee_per_hour;
        const totalHours = course.total_length * course.week_length;
        
        // Множитель для выходных/праздников
        let isWeekendOrHoliday = 1;
        if (startDate) {
            const date = new Date(startDate);
            const dayOfWeek = date.getDay();
            // 0 - воскресенье, 6 - суббота
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                isWeekendOrHoliday = 1.5;
            }
        }
        
        // Доплаты за утро/вечер
        let morningSurcharge = 0;
        let eveningSurcharge = 0;
        
        if (startTime) {
            const hour = parseInt(startTime.split(':')[0]);
            if (hour >= 9 && hour < 12) {
                morningSurcharge = 400;
            } else if (hour >= 18 && hour < 20) {
                eveningSurcharge = 1000;
            }
        }
        
        // Базовая стоимость
        let totalPrice = ((courseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * students;
        
        // Дополнительные опции
        const supplementary = document.getElementById('modal-supplementary').checked;
        const personalized = document.getElementById('modal-personalized').checked;
        const excursions = document.getElementById('modal-excursions').checked;
        const assessment = document.getElementById('modal-assessment').checked;
        const interactive = document.getElementById('modal-interactive').checked;
        
        if (supplementary) totalPrice += 2000 * students;
        if (personalized) totalPrice += 1500 * course.total_length;
        if (excursions) totalPrice *= 1.25;
        if (assessment) totalPrice += 300;
        if (interactive) totalPrice *= 1.5;
        
        // Автоматические скидки
        const discountInfo = document.getElementById('discount-info');
        let discounts = [];
        let discountApplied = false;
        
        // Скидка за раннюю регистрацию
        if (startDate) {
            const today = new Date();
            const courseStart = new Date(startDate);
            const daysDiff = (courseStart - today) / (1000 * 60 * 60 * 24);
            
            if (daysDiff >= 30) {
                totalPrice *= 0.9;
                discounts.push('Скидка за раннюю регистрацию: 10%');
                discountApplied = true;
            }
        }
        
        // Скидка за групповую запись
        if (students >= 5) {
            totalPrice *= 0.85;
            discounts.push('Скидка за групповую запись: 15%');
            discountApplied = true;
        }
        
        // Наценка за интенсивный курс
        if (course.week_length >= 5) {
            totalPrice *= 1.2;
            discounts.push('Наценка за интенсивный курс: 20%');
            discountApplied = true;
        }
        
        // Обновляем информацию о скидках
        if (discountApplied) {
            discountInfo.innerHTML = `<strong>Примененные скидки/надбавки:</strong><br>${discounts.join('<br>')}`;
            discountInfo.style.display = 'block';
        } else {
            discountInfo.style.display = 'none';
        }
        
        // Отображаем итоговую стоимость
        document.getElementById('modal-total-price').textContent = Math.round(totalPrice) + ' руб';
    }
    
    async function submitCourseApplication() {
        try {
            const course = selectedCourse;
            if (!course) {
                api.showNotification('Выберите курс', 'warning');
                return;
            }
            
            // Собираем данные формы
            const startDate = document.getElementById('modal-start-date').value;
            const startTime = document.getElementById('modal-start-time').value;
            const students = parseInt(document.getElementById('modal-students').value) || 1;
            
            if (!startDate || !startTime) {
                api.showNotification('Заполните дату и время начала', 'warning');
                return;
            }
            
            // Рассчитываем общую продолжительность в часах
            const duration = course.total_length * course.week_length;
            
            // Собираем данные заявки
            const orderData = {
                course_id: course.id,
                tutor_id: 0, // Для курсов tutor_id = 0
                date_start: startDate,
                time_start: startTime,
                duration: duration,
                persons: students,
                price: parseInt(document.getElementById('modal-total-price').textContent),
                early_registration: document.getElementById('modal-start-date').value ? 
                    ((new Date(startDate) - new Date()) >= 30 * 24 * 60 * 60 * 1000) : false,
                group_enrollment: students >= 5,
                intensive_course: course.week_length >= 5,
                supplementary: document.getElementById('modal-supplementary').checked,
                personalized: document.getElementById('modal-personalized').checked,
                excursions: document.getElementById('modal-excursions').checked,
                assessment: document.getElementById('modal-assessment').checked,
                interactive: document.getElementById('modal-interactive').checked
            };
            
            // Отправляем заявку
            const result = await api.createOrder(orderData);
            
            // Закрываем модальное окно
            bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
            
            // Показываем уведомление
            api.showNotification('Заявка успешно отправлена!', 'success');
            
            // Сбрасываем форму
            selectedCourse = null;
            
        } catch (error) {
            console.error('Error submitting course application:', error);
            api.showNotification('Ошибка при отправке заявки', 'danger');
        }
    }
    
    function openTutorRequest(tutor = null) {
        const modal = new bootstrap.Modal(document.getElementById('tutorRequestModal'));
        
        if (tutor) {
            document.getElementById('request-tutor-select').value = tutor.id;
        }
        
        // Устанавливаем минимальную дату на завтра
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('request-date').min = tomorrow.toISOString().split('T')[0];
        
        // Устанавливаем дефолтную дату через 3 дня
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        document.getElementById('request-date').value = defaultDate.toISOString().split('T')[0];
        
        modal.show();
    }
    
    async function submitTutorRequest() {
        try {
            const tutorId = parseInt(document.getElementById('request-tutor-select').value);
            const date = document.getElementById('request-date').value;
            const time = document.getElementById('request-time').value;
            const duration = parseInt(document.getElementById('request-duration').value) || 1;
            const persons = parseInt(document.getElementById('request-persons').value) || 1;
            
            if (!tutorId || !date || !time) {
                api.showNotification('Заполните все обязательные поля', 'warning');
                return;
            }
            
            // Находим репетитора
            const tutor = allTutors.find(t => t.id === tutorId);
            if (!tutor) {
                api.showNotification('Репетитор не найден', 'error');
                return;
            }
            
            // Рассчитываем стоимость
            const totalPrice = tutor.price_per_hour * duration * persons;
            
            // Собираем данные заявки
            const orderData = {
                tutor_id: tutorId,
                course_id: 0, // Для репетиторов course_id = 0
                date_start: date,
                time_start: time,
                duration: duration,
                persons: persons,
                price: totalPrice,
                early_registration: false,
                group_enrollment: false,
                intensive_course: false,
                supplementary: false,
                personalized: false,
                excursions: false,
                assessment: false,
                interactive: false
            };
            
            // Отправляем заявку
            const result = await api.createOrder(orderData);
            
            // Закрываем модальное окно
            bootstrap.Modal.getInstance(document.getElementById('tutorRequestModal')).hide();
            
            // Показываем уведомление
            api.showNotification('Заявка на репетитора успешно отправлена!', 'success');
            
            // Сбрасываем форму
            document.getElementById('tutor-request-form').reset();
            
        } catch (error) {
            console.error('Error submitting tutor request:', error);
            api.showNotification('Ошибка при отправке заявки', 'danger');
        }
    }
});
