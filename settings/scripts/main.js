document.addEventListener('DOMContentLoaded', function() {
    // Текущие данные
    let allCourses = [];
    let allTutors = [];
    let currentCoursePage = 1;
    const coursesPerPage = 6;
    
    // Функция для получения инициалов
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
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
            
            api.showNotification('Добро пожаловать в Polyglot School!', 'info');
            
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
            populateTrialLessonCourseSelect();
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
        
        renderPagination(filteredCourses.length, coursesPerPage);
    }
    
    function createCourseCard(course) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 fade-in course-card';
        
        const totalHours = course.total_length * course.week_length;
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-primary">${course.level}</span>
                            <span class="badge bg-info">${totalHours} часов</span>
                        </div>
                        <h5 class="card-title text-primary">${course.name}</h5>
                        <p class="card-text text-muted mt-2">
                            ${course.description}
                        </p>
                    </div>
                    
                    <div class="mt-auto">
                        <div class="row g-2 mb-3">
                            <div class="col-12">
                                <small class="text-muted d-block">Преподаватель</small>
                                <div class="fw-semibold">${course.teacher}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Длительность</small>
                                <div class="fw-semibold">${course.total_length} недель</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">В неделю</small>
                                <div class="fw-semibold">${course.week_length} часов</div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                <span class="fw-bold text-primary fs-5">${course.course_fee_per_hour} руб/час</span>
                            </div>
                            <button class="btn btn-sm apply-course-btn" data-course-id="${course.id}">
                                Записаться
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        col.querySelector('.apply-course-btn').addEventListener('click', () => {
            openCourseApplication(course);
        });
        
        return col;
    }
    
    function renderPagination(totalItems, itemsPerPage) {
        const pagination = document.getElementById('courses-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <ul class="pagination justify-content-center">
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
                const coursesSection = document.getElementById('courses');
                if (coursesSection) {
                    window.scrollTo({
                        top: coursesSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
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
        
        const initials = getInitials(tutor.name);
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="teacher-initials-small">${initials}</div>
                    <div>
                        <strong>${tutor.name}</strong>
                        <div class="text-muted small">Опыт: ${tutor.work_experience} лет</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${tutor.language_level}</span>
            </td>
            <td>
                ${tutor.languages_offered.map(lang => 
                    `<span class="badge bg-secondary me-1 mb-1">${lang}</span>`
                ).join('')}
            </td>
            <td class="fw-bold text-primary">${tutor.price_per_hour} руб/час</td>
            <td>
                <button class="btn btn-sm btn-primary request-tutor-btn" data-tutor-id="${tutor.id}">
                    <i class="bi bi-calendar-check me-1"></i>Запись
                </button>
            </td>
        `;
        
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
    
    function populateTrialLessonCourseSelect() {
        const select = document.getElementById('trial-course-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите курс</option>';
        allCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} - ${course.level} (${course.teacher})`;
            select.appendChild(option);
        });
    }
    
    function openCourseApplication(course) {
        document.getElementById('modal-course-name').value = course.name;
        document.getElementById('modal-course-teacher').value = course.teacher;
        document.getElementById('modal-duration').value = course.total_length;
        document.getElementById('modal-total-hours').value = course.total_length * course.week_length;
        
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
        
        document.getElementById('modal-start-time').innerHTML = '<option value="">Сначала выберите дату</option>';
        document.getElementById('modal-start-time').disabled = true;
        
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`).checked = false;
        });
        
        document.getElementById('discount-info').style.display = 'none';
        
        calculateTotalPrice(course);
        
        const modal = new bootstrap.Modal(document.getElementById('applyModal'));
        modal.show();
    }
    
    function openTrialLessonModal() {
        const modal = new bootstrap.Modal(document.getElementById('trialLessonModal'));
        
        // Сброс формы
        document.getElementById('trial-course-select').selectedIndex = 0;
        document.getElementById('trial-date-start').value = '';
        document.getElementById('trial-time-start').value = '';
        document.getElementById('trial-persons').value = 1;
        document.getElementById('trial-duration').value = 1;
        
        // Установка минимальной даты (завтра)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('trial-date-start').min = tomorrow.toISOString().split('T')[0];
        
        // Установка даты по умолчанию (через 3 дня)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 3);
        document.getElementById('trial-date-start').value = defaultDate.toISOString().split('T')[0];
        
        modal.show();
    }
    
    function setupEventListeners() {
        document.getElementById('modal-start-date').addEventListener('change', function() {
            const courseName = document.getElementById('modal-course-name').value;
            const course = allCourses.find(c => c.name === courseName);
            if (!course) return;
            
            const timeSelect = document.getElementById('modal-start-time');
            const date = this.value;
            
            if (!date || !course) {
                timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
                timeSelect.disabled = true;
                return;
            }
            
            timeSelect.innerHTML = '<option value="">Выберите время начала</option>';
            
            const timesForDate = course.start_dates
                .filter(dt => dt.startsWith(date))
                .map(dt => {
                    const timePart = dt.split('T')[1].substring(0, 5);
                    return timePart;
                });
            
            const uniqueTimes = [...new Set(timesForDate)];
            
            uniqueTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
            
            if (course) {
                const startDate = new Date(date);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + (course.total_length * 7));
                document.getElementById('modal-end-date').value = api.formatDate(endDate.toISOString());
            }
            
            calculateTotalPrice(course);
        });
        
        document.getElementById('modal-start-time').addEventListener('change', function() {
            const courseName = document.getElementById('modal-course-name').value;
            const course = allCourses.find(c => c.name === courseName);
            if (course) calculateTotalPrice(course);
        });
        
        document.getElementById('modal-students').addEventListener('input', function() {
            const courseName = document.getElementById('modal-course-name').value;
            const course = allCourses.find(c => c.name === courseName);
            if (course) calculateTotalPrice(course);
        });
        
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`).addEventListener('change', function() {
                const courseName = document.getElementById('modal-course-name').value;
                const course = allCourses.find(c => c.name === courseName);
                if (course) calculateTotalPrice(course);
            });
        });
        
        document.getElementById('submit-application').addEventListener('click', submitCourseApplication);
        document.getElementById('submit-tutor-request').addEventListener('click', submitTutorRequest);
        document.getElementById('submit-trial-lesson').addEventListener('click', submitTrialLesson);
        
        // Обработчик для кнопки в футере
        document.getElementById('trial-lesson-btn').addEventListener('click', function(e) {
            e.preventDefault();
            openTrialLessonModal();
        });
        
        // Обработчик выбора курса для пробного урока
        document.getElementById('trial-course-select').addEventListener('change', function() {
            const courseId = parseInt(this.value);
            if (courseId) {
                const course = allCourses.find(c => c.id === courseId);
                if (course) {
                    // Обновляем доступные даты для выбранного курса
                    updateTrialLessonDates(course);
                }
            }
        });
        
        // Обработчик изменения даты для пробного урока
        document.getElementById('trial-date-start').addEventListener('change', function() {
            const courseId = parseInt(document.getElementById('trial-course-select').value);
            if (courseId) {
                const course = allCourses.find(c => c.id === courseId);
                if (course) {
                    updateTrialLessonTimes(course, this.value);
                }
            }
        });
    }
    
    function updateTrialLessonDates(course) {
        const dateInput = document.getElementById('trial-date-start');
        const timeInput = document.getElementById('trial-time-start');
        
        // Получаем уникальные даты из курса
        const uniqueDates = [...new Set(course.start_dates.map(date => date.split('T')[0]))];
        
        // Устанавливаем подсказку о доступных датах
        if (uniqueDates.length > 0) {
            const minDate = uniqueDates[0];
            const maxDate = uniqueDates[uniqueDates.length - 1];
            
            dateInput.min = minDate;
            dateInput.max = maxDate;
            dateInput.title = `Доступные даты: с ${api.formatDate(minDate)} по ${api.formatDate(maxDate)}`;
            
            // Устанавливаем первую доступную дату
            dateInput.value = minDate;
            
            // Обновляем доступные времена
            updateTrialLessonTimes(course, minDate);
        } else {
            timeInput.disabled = true;
            timeInput.value = '';
        }
    }
    
    function updateTrialLessonTimes(course, selectedDate) {
        const timeInput = document.getElementById('trial-time-start');
        
        if (!selectedDate) {
            timeInput.disabled = true;
            timeInput.value = '';
            return;
        }
        
        // Получаем времена для выбранной даты
        const timesForDate = course.start_dates
            .filter(dt => dt.startsWith(selectedDate))
            .map(dt => {
                const timePart = dt.split('T')[1].substring(0, 5);
                return timePart;
            });
        
        const uniqueTimes = [...new Set(timesForDate)];
        
        if (uniqueTimes.length > 0) {
            timeInput.disabled = false;
            // Устанавливаем первое доступное время
            timeInput.value = uniqueTimes[0];
        } else {
            timeInput.disabled = true;
            timeInput.value = '';
        }
    }
    
    function calculateTotalPrice(course) {
        const students = parseInt(document.getElementById('modal-students').value) || 1;
        const startDate = document.getElementById('modal-start-date').value;
        const startTime = document.getElementById('modal-start-time').value;
        
        const courseFeePerHour = course.course_fee_per_hour;
        const totalHours = course.total_length * course.week_length;
        
        let isWeekendOrHoliday = 1;
        if (startDate) {
            const date = new Date(startDate);
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                isWeekendOrHoliday = 1.5;
            }
        }
        
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
        
        let totalPrice = ((courseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * students;
        
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
        
        const discountInfo = document.getElementById('discount-info');
        let discounts = [];
        let discountApplied = false;
        
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
        
        if (students >= 5) {
            totalPrice *= 0.85;
            discounts.push('Скидка за групповую запись: 15%');
            discountApplied = true;
        }
        
        if (course.week_length >= 5) {
            totalPrice *= 1.2;
            discounts.push('Наценка за интенсивный курс: 20%');
            discountApplied = true;
        }
        
        if (discountApplied) {
            discountInfo.innerHTML = `<strong>Примененные скидки/надбавки:</strong><br>${discounts.join('<br>')}`;
            discountInfo.style.display = 'block';
        } else {
            discountInfo.style.display = 'none';
        }
        
        document.getElementById('modal-total-price').textContent = Math.round(totalPrice) + ' руб';
    }
    
    async function submitCourseApplication() {
        try {
            const courseName = document.getElementById('modal-course-name').value;
            const course = allCourses.find(c => c.name === courseName);
            if (!course) {
                api.showNotification('Курс не найден', 'warning');
                return;
            }
            
            const startDate = document.getElementById('modal-start-date').value;
            const startTime = document.getElementById('modal-start-time').value;
            const students = parseInt(document.getElementById('modal-students').value) || 1;
            
            if (!startDate || !startTime) {
                api.showNotification('Заполните дату и время начала', 'warning');
                return;
            }
            
            const duration = course.total_length * course.week_length;
            
            const orderData = {
                course_id: course.id,
                tutor_id: 0,
                date_start: startDate,
                time_start: startTime,
                duration: duration,
                persons: students,
                price: parseInt(document.getElementById('modal-total-price').textContent.replace(/\s+/g, '').replace('руб', '')),
                early_registration: startDate ? 
                    ((new Date(startDate) - new Date()) >= 30 * 24 * 60 * 60 * 1000) : false,
                group_enrollment: students >= 5,
                intensive_course: course.week_length >= 5,
                supplementary: document.getElementById('modal-supplementary').checked,
                personalized: document.getElementById('modal-personalized').checked,
                excursions: document.getElementById('modal-excursions').checked,
                assessment: document.getElementById('modal-assessment').checked,
                interactive: document.getElementById('modal-interactive').checked
            };
            
            const result = await api.createOrder(orderData);
            
            bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
            
            api.showNotification('Заявка успешно отправлена!', 'success');
            
            document.getElementById('course-application-form').reset();
            
        } catch (error) {
            console.error('Error submitting course application:', error);
            api.showNotification('Ошибка при отправке заявки: ' + error.message, 'danger');
        }
    }
    
    function openTutorRequest(tutor = null) {
        const modal = new bootstrap.Modal(document.getElementById('tutorRequestModal'));
        
        if (tutor) {
            document.getElementById('request-tutor-select').value = tutor.id;
        }
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('request-date').min = tomorrow.toISOString().split('T')[0];
        
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
            
            const tutor = allTutors.find(t => t.id === tutorId);
            if (!tutor) {
                api.showNotification('Репетитор не найден', 'danger');
                return;
            }
            
            const totalPrice = tutor.price_per_hour * duration * persons;
            
            const orderData = {
                tutor_id: tutorId,
                course_id: 0,
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
            
            const result = await api.createOrder(orderData);
            
            bootstrap.Modal.getInstance(document.getElementById('tutorRequestModal')).hide();
            
            api.showNotification('Заявка на репетитора успешно отправлена!', 'success');
            
            document.getElementById('tutor-request-form').reset();
            
        } catch (error) {
            console.error('Error submitting tutor request:', error);
            api.showNotification('Ошибка при отправке заявки: ' + error.message, 'danger');
        }
    }
    
    async function submitTrialLesson() {
        try {
            const courseId = parseInt(document.getElementById('trial-course-select').value);
            const date = document.getElementById('trial-date-start').value;
            const time = document.getElementById('trial-time-start').value;
            const duration = parseInt(document.getElementById('trial-duration').value) || 1;
            const persons = parseInt(document.getElementById('trial-persons').value) || 1;
            
            if (!courseId || !date || !time) {
                api.showNotification('Заполните все обязательные поля', 'warning');
                return;
            }
            
            const course = allCourses.find(c => c.id === courseId);
            if (!course) {
                api.showNotification('Курс не найден', 'danger');
                return;
            }
            
            // Для пробного урока делаем фиксированную цену 0 или скидку 100%
            const totalPrice = 0; // Бесплатный пробный урок
            
            const orderData = {
                course_id: courseId,
                tutor_id: 0,
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
                interactive: false,
                trial_lesson: true // Добавляем метку, что это пробный урок
            };
            
            const result = await api.createOrder(orderData);
            
            bootstrap.Modal.getInstance(document.getElementById('trialLessonModal')).hide();
            
            api.showNotification('Заявка на пробный урок успешно отправлена!', 'success');
            
            document.getElementById('trial-lesson-form').reset();
            
        } catch (error) {
            console.error('Error submitting trial lesson:', error);
            api.showNotification('Ошибка при отправке заявки: ' + error.message, 'danger');
        }
    }
    
    // Плавный скролл
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});
