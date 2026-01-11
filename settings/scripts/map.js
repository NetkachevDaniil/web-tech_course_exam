document.addEventListener('DOMContentLoaded', function() {
    // Данные о языковых ресурсах Москвы
    const languageResources = [
        {
            id: 1,
            name: 'Институт Конфуция МГУ',
            type: 'education',
            address: 'Москва, Ленинские горы, 1',
            schedule: 'Пн-Пт: 9:00-20:00, Сб: 10:00-16:00',
            contact: '+7 (495) 939-55-55',
            description: 'Китайский язык и культура, подготовка к HSK, культурные мероприятия',
            coordinates: [55.697662, 37.539071],
            website: 'https://confucius.msu.ru/'
        },
        {
            id: 2,
            name: 'Британский Совет',
            type: 'education',
            address: 'Москва, ул. Николоямская, 1',
            schedule: 'Пн-Пт: 10:00-19:00, Сб: 10:00-17:00',
            contact: '+7 (495) 287-18-00',
            description: 'Английский язык, подготовка к IELTS, курсы для преподавателей',
            coordinates: [55.748819, 37.648160],
            website: 'https://www.britishcouncil.ru/'
        },
        {
            id: 3,
            name: 'Гёте-Институт',
            type: 'culture',
            address: 'Москва, Ленинский проспект, 15',
            schedule: 'Пн-Чт: 9:00-20:00, Пт: 9:00-18:00',
            contact: '+7 (495) 936-24-57',
            description: 'Немецкий язык, экзамены Goethe-Zertifikat, культурные мероприятия',
            coordinates: [55.781552, 37.571887],
            website: 'https://www.goethe.de/moskau'
        },
        {
            id: 4,
            name: 'Институт Сервантеса',
            type: 'culture',
            address: 'Москва, Новинский бульвар, 20А',
            schedule: 'Пн-Пт: 10:00-19:00, Сб: 10:00-14:00',
            contact: '+7 (495) 609-90-22',
            description: 'Испанский язык, экзамены DELE, испанская культура',
            coordinates: [55.755699, 37.585537],
            website: 'https://moscu.cervantes.es/'
        },
        {
            id: 5,
            name: 'Библиотека иностранной литературы',
            type: 'library',
            address: 'Москва, ул. Николоямская, 1',
            schedule: 'Вт-Сб: 11:00-21:00, Вс: 11:00-19:00',
            contact: '+7 (495) 915-36-41',
            description: 'Книги на иностранных языках, языковые курсы, мероприятия',
            coordinates: [55.748600, 37.647586],
            website: 'https://libfl.ru/'
        },
        {
            id: 6,
            name: 'Французский институт',
            type: 'library',
            address: 'Москва, Милютинский пер., 10',
            schedule: 'Пн-Пт: 10:00-20:00, Сб: 10:00-17:00',
            contact: '+7 (495) 916-20-10',
            description: 'Французский язык, медиатека, культурные мероприятия',
            coordinates: [55.762583, 37.631941],
            website: 'https://www.institutfrancais.ru/'
        },
        {
            id: 7,
            name: 'Esp Club Moscú',
            type: 'cafe',
            address: 'Москва, ул. Большие Каменщики, 9',
            schedule: 'Ежедневно: 12:00-23:00',
            contact: '+7 (495) 959-88-99',
            description: 'Испанский разговорный клуб, тапас, испанская атмосфера',
            coordinates: [55.738078, 37.654975],
            website: 'https://cafe-espanol.ru/'
        },
        {
            id: 8,
            name: 'English Speaking Club (Moscow)',
            type: 'cafe',
            address: 'Москва, ул. Новослободская 23',
            schedule: 'Вт, Чт, Сб: 19:00-22:00',
            contact: '+7 (495) 123-45-67',
            description: 'Английский разговорный клуб, кофе, общение с носителями языка',
            coordinates: [55.781398, 37.598537],
            website: '#'
        }
    ];

    // Инициализация карты
    let map;
    let placemarks = [];
    let searchPlacemarks = [];

    function initYandexMap() {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;

        // Очищаем контейнер
        mapContainer.innerHTML = '<div id="yandex-map" style="width: 100%; height: 100%;"></div>';

        // Инициализируем Яндекс.Карту
        ymaps.ready(init);

        function init() {
            // Создаем карту
            map = new ymaps.Map('yandex-map', {
                center: [55.751244, 37.618423], // Москва
                zoom: 11,
                controls: ['zoomControl', 'fullscreenControl']
            });

            // Добавляем все метки при загрузке
            addAllPlacemarks();

            // Настраиваем поиск
            setupSearch();

            // Настраиваем фильтры
            setupFilters();

            // Показываем информацию о популярных местах
            setupPopularPlaces();
        }
    }

    function addAllPlacemarks() {
        // Удаляем старые метки ресурсов
        clearResourcePlacemarks();
        
        // Добавляем все метки из массива
        languageResources.forEach(resource => {
            const placemark = createPlacemark(resource);
            placemarks.push(placemark);
            map.geoObjects.add(placemark);
        });
    }

    function filterPlacemarks(filterType = 'all') {
        // Удаляем старые метки ресурсов
        clearResourcePlacemarks();

        // Фильтруем ресурсы
        const filteredResources = languageResources.filter(resource => {
            return filterType === 'all' || resource.type === filterType;
        });

        // Добавляем новые метки
        filteredResources.forEach(resource => {
            const placemark = createPlacemark(resource);
            placemarks.push(placemark);
            map.geoObjects.add(placemark);
        });
    }

    function clearResourcePlacemarks() {
        // Удаляем все метки ресурсов с карты
        placemarks.forEach(placemark => {
            map.geoObjects.remove(placemark);
        });
        placemarks = [];
    }

    function clearSearchPlacemarks() {
        // Удаляем все поисковые метки с карты
        searchPlacemarks.forEach(placemark => {
            map.geoObjects.remove(placemark);
        });
        searchPlacemarks = [];
    }

    function createPlacemark(resource) {
        // Определяем цвет метки в зависимости от типа
        let color;
        switch(resource.type) {
            case 'education': color = '#3498DB'; break;
            case 'library': color = '#27AE60'; break;
            case 'culture': color = '#F39C12'; break;
            case 'cafe': color = '#9B59B6'; break;
            default: color = '#2C3E50';
        }

        // Создаем метку
        const placemark = new ymaps.Placemark(resource.coordinates, {
            balloonContentHeader: `
                <div class="balloon-content">
                    <h4 class="balloon-title">${resource.name}</h4>
                    <div class="d-flex align-items-center mb-2">
                        <span class="badge ${getTypeClass(resource.type)} me-2">${getTypeName(resource.type)}</span>
                        <small class="text-muted">ID: ${resource.id}</small>
                    </div>
            `,
            balloonContentBody: `
                    <div class="balloon-info">
                        <div class="mb-2">
                            <div class="balloon-label">Адрес</div>
                            <div class="balloon-value">${resource.address}</div>
                        </div>
                        <div class="mb-2">
                            <div class="balloon-label">Часы работы</div>
                            <div class="balloon-value">${resource.schedule}</div>
                        </div>
                        <div class="mb-2">
                            <div class="balloon-label">Контакт</div>
                            <div class="balloon-value">${resource.contact}</div>
                        </div>
                        <div class="mb-2">
                            <div class="balloon-label">Описание</div>
                            <div class="balloon-value">${resource.description}</div>
                        </div>
                        ${resource.website ? `
                        <div class="mb-2">
                            <div class="balloon-label">Сайт</div>
                            <div class="balloon-value">
                                <a href="${resource.website}" target="_blank" class="text-primary">${resource.website}</a>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `,
            hintContent: resource.name
        }, {
            preset: 'islands#circleIcon',
            iconColor: color,
            balloonCloseButton: true,
            balloonPanelMaxMapArea: 0
        });

        return placemark;
    }

    function setupSearch() {
        const searchInput = document.getElementById('map-search');
        const searchBtn = document.getElementById('search-btn');

        // Поиск при нажатии кнопки
        searchBtn.addEventListener('click', performSearch);
        
        // Поиск при нажатии Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        function performSearch() {
            const query = searchInput.value.trim();
            
            if (!query) {
                // Если поиск пустой, возвращаем все места с учетом активного фильтра
                const activeFilter = getActiveFilter();
                filterPlacemarks(activeFilter);
                return;
            }

            // Используем геокодинг Яндекса
            ymaps.geocode(query, {
                results: 10
            }).then(function(res) {
                const firstGeoObject = res.geoObjects.get(0);
                
                if (firstGeoObject) {
                    // Удаляем старые поисковые метки
                    clearSearchPlacemarks();
                    
                    // Создаем метку для найденного места
                    const searchPlacemark = new ymaps.Placemark(
                        firstGeoObject.geometry.getCoordinates(),
                        {
                            balloonContent: firstGeoObject.getAddressLine(),
                            iconCaption: 'Результат поиска'
                        },
                        {
                            preset: 'islands#redDotIcon',
                            iconColor: '#dc3545'
                        }
                    );
                    
                    searchPlacemark.properties.set('isSearchResult', true);
                    map.geoObjects.add(searchPlacemark);
                    searchPlacemarks.push(searchPlacemark);
                    
                    // Перемещаем карту к результату
                    map.setCenter(firstGeoObject.geometry.getCoordinates(), 15);
                    
                    // Открываем балун
                    searchPlacemark.balloon.open();
                } else {
                    api.showNotification('Местоположение не найдено', 'warning');
                }
            }).catch(function(error) {
                console.error('Geocoding error:', error);
                api.showNotification('Ошибка поиска', 'danger');
            });
        }
    }

    function setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    const type = btn.dataset.type;
                    resetButtonStyle(btn, type);
                });
                
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                setActiveButtonStyle(this);
                
                // Получаем тип фильтра
                const filterType = this.dataset.type;
                
                // Обновляем метки в соответствии с фильтром
                filterPlacemarks(filterType);
                
                // Сбрасываем поиск
                document.getElementById('map-search').value = '';
            });
        });
    }

    function setActiveButtonStyle(button) {
        const type = button.dataset.type;
        switch(type) {
            case 'all':
                button.style.backgroundColor = '#2C3E50';
                button.style.color = 'white';
                button.style.border = 'none';
                break;
            case 'education':
                button.style.backgroundColor = '#3498DB';
                button.style.color = 'white';
                button.style.border = 'none';
                break;
            case 'library':
                button.style.backgroundColor = '#27AE60';
                button.style.color = 'white';
                button.style.border = 'none';
                break;
            case 'culture':
                button.style.backgroundColor = '#F39C12';
                button.style.color = 'white';
                button.style.border = 'none';
                break;
            case 'cafe':
                button.style.backgroundColor = '#9B59B6';
                button.style.color = 'white';
                button.style.border = 'none';
                break;
        }
    }

    function resetButtonStyle(button, type) {
        switch(type) {
            case 'all':
                button.style.backgroundColor = 'transparent';
                button.style.color = '#2C3E50';
                button.style.border = '2px solid #2C3E50';
                break;
            case 'education':
                button.style.backgroundColor = 'transparent';
                button.style.color = '#3498DB';
                button.style.border = '2px solid #3498DB';
                break;
            case 'library':
                button.style.backgroundColor = 'transparent';
                button.style.color = '#27AE60';
                button.style.border = '2px solid #27AE60';
                break;
            case 'culture':
                button.style.backgroundColor = 'transparent';
                button.style.color = '#F39C12';
                button.style.border = '2px solid #F39C12';
                break;
            case 'cafe':
                button.style.backgroundColor = 'transparent';
                button.style.color = '#9B59B6';
                button.style.border = '2px solid #9B59B6';
                break;
        }
    }

    function getActiveFilter() {
        const activeButton = document.querySelector('.filter-btn.active');
        return activeButton ? activeButton.dataset.type : 'all';
    }

    function getTypeClass(type) {
        switch(type) {
            case 'education': return 'bg-primary';
            case 'library': return 'bg-success';
            case 'culture': return 'bg-warning';
            case 'cafe': return 'bg-info';
            default: return 'bg-secondary';
        }
    }

    function getTypeName(type) {
        switch(type) {
            case 'education': return 'Образовательное учреждение';
            case 'library': return 'Библиотека';
            case 'culture': return 'Культурный центр';
            case 'cafe': return 'Языковое кафе';
            default: return 'Другое';
        }
    }

    function setupPopularPlaces() {
        // Добавляем обработчики для популярных мест
        const popularPlaces = document.querySelectorAll('.list-group-item');
        
        popularPlaces.forEach((place) => {
            place.addEventListener('click', function() {
                // Получаем название места из заголовка
                const title = this.querySelector('h6').textContent;
                
                // Ищем соответствующий ресурс
                let resource;
                if (title.includes('Институт Конфуция')) {
                    resource = languageResources.find(r => r.name.includes('Конфуция'));
                } else if (title.includes('Британский Совет')) {
                    resource = languageResources.find(r => r.name.includes('Британский'));
                } else if (title.includes('Гёте-Институт')) {
                    resource = languageResources.find(r => r.name.includes('Гёте'));
                } else if (title.includes('Café Español')) {
                    resource = languageResources.find(r => r.name.includes('Esp Club'));
                }
                
                if (resource) {
                    // Находим кнопку фильтра соответствующего типа
                    const filterButton = document.querySelector(`.filter-btn[data-type="${resource.type}"]`);
                    if (filterButton) {
                        // Убираем активный класс у всех кнопок
                        document.querySelectorAll('.filter-btn').forEach(btn => {
                            btn.classList.remove('active');
                            resetButtonStyle(btn, btn.dataset.type);
                        });
                        // Активируем кнопку фильтра
                        filterButton.classList.add('active');
                        setActiveButtonStyle(filterButton);
                        
                        // Фильтруем метки по типу
                        filterPlacemarks(resource.type);
                    }
                    
                    // Перемещаем карту к месту с увеличенным зумом
                    map.setCenter(resource.coordinates, 16);
                    
                    // Находим метку и открываем балун
                    setTimeout(() => {
                        const targetPlacemark = placemarks.find(p => {
                            const coords = p.geometry.getCoordinates();
                            return Math.abs(coords[0] - resource.coordinates[0]) < 0.001 && 
                                   Math.abs(coords[1] - resource.coordinates[1]) < 0.001;
                        });
                        
                        if (targetPlacemark) {
                            targetPlacemark.balloon.open();
                        }
                    }, 500);
                }
            });
        });
    }

    // Загружаем API Яндекс.Карт
    if (!window.ymaps) {
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=02e0b5d0-e1b4-4627-8cee-2237dc63579c&lang=ru_RU';
        script.onload = initYandexMap;
        document.head.appendChild(script);
    } else {
        initYandexMap();
    }

    // Добавляем обработчики для популярных мест
    setTimeout(() => {
        const popularItems = document.querySelectorAll('.list-group-item');
        popularItems.forEach(item => {
            item.style.cursor = 'pointer';
            item.classList.add('hover-effect');
            
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.transition = 'transform 0.3s ease';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });
    }, 1000);
});
