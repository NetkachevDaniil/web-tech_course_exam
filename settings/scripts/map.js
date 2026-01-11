document.addEventListener('DOMContentLoaded', function() {
    // Ресурсы для изучения китайского языка в Москве
    const resources = [
        {
            id: 1,
            name: 'Институт Конфуция МГУ',
            type: 'education',
            address: 'Ленинские горы, д. 1, Москва',
            coordinates: [55.7039, 37.5286],
            workingHours: 'Пн-Пт: 9:00-18:00',
            contact: '+7 (495) 939-00-00',
            description: 'Курсы китайского языка всех уровней, подготовка к HSK',
            services: 'Языковые курсы, тестирование HSK, культурные мероприятия'
        },
        {
            id: 2,
            name: 'Китайский культурный центр',
            type: 'center',
            address: 'ул. Правды, д. 1, Москва',
            coordinates: [55.7964, 37.5836],
            workingHours: 'Вт-Вс: 10:00-20:00',
            contact: '+7 (495) 612-11-22',
            description: 'Центр китайской культуры и языка',
            services: 'Выставки, лекции, языковые курсы, библиотека'
        },
        {
            id: 3,
            name: 'Библиотека иностранной литературы',
            type: 'library',
            address: 'ул. Николоямская, д. 1, Москва',
            coordinates: [55.7445, 37.6464],
            workingHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00',
            contact: '+7 (495) 915-36-41',
            description: 'Крупнейшая библиотека с литературой на китайском языке',
            services: 'Книги, журналы, языковые клубы, электронные ресурсы'
        },
        {
            id: 4,
            name: 'Языковой клуб "Восток"',
            type: 'cafe',
            address: 'ул. Арбат, д. 45, Москва',
            coordinates: [55.7495, 37.5905],
            workingHours: 'Пн-Чт: 12:00-23:00, Пт-Вс: 12:00-00:00',
            contact: '+7 (495) 123-45-67',
            description: 'Кафе для практики китайского языка в неформальной обстановке',
            services: 'Языковые встречи, игры, разговорные клубы'
        },
        {
            id: 5,
            name: 'Школа китайского языка "Ханьцзы"',
            type: 'education',
            address: 'ул. Тверская, д. 22, Москва',
            coordinates: [55.7620, 37.6070],
            workingHours: 'Пн-Вс: 9:00-21:00',
            contact: '+7 (495) 222-33-44',
            description: 'Специализированная школа китайского языка',
            services: 'Курсы для всех уровней, индивидуальные занятия, подготовка к HSK'
        },
        {
            id: 6,
            name: 'Азиатский культурный центр',
            type: 'center',
            address: 'Проспект Мира, д. 95, Москва',
            coordinates: [55.7877, 37.6338],
            workingHours: 'Вт-Вс: 10:00-20:00',
            contact: '+7 (495) 555-66-77',
            description: 'Центр азиатских культур с акцентом на Китай',
            services: 'Выставки, лекции, мастер-классы, языковые курсы'
        }
    ];
    
    // Инициализация карты
    let map;
    let placemarks = [];
    
    function initMap() {
        if (!ymaps) {
            console.error('Yandex Maps API не загружен');
            showMapError();
            return;
        }
        
        ymaps.ready(function() {
            // Создаем карту
            map = new ymaps.Map('map', {
                center: [55.751244, 37.618423], // Центр Москвы
                zoom: 11,
                controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
            });
            
            // Добавляем поиск
            const searchControl = new ymaps.control.SearchControl({
                options: {
                    noPlacemark: true
                }
            });
            map.controls.add(searchControl);
            
            // Создаем кластеризатор
            const clusterer = new ymaps.Clusterer({
                preset: 'islands#invertedDarkOrangeClusterIcons',
                clusterDisableClickZoom: true,
                clusterOpenBalloonOnClick: true
            });
            
            // Добавляем метки
            updateMapMarkers();
            
            // Обработчик поиска
            document.getElementById('map-search-btn').addEventListener('click', searchOnMap);
            document.getElementById('map-search').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') searchOnMap();
            });
            
            // Обработчики фильтров
            document.querySelectorAll('#map-filters input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateMapMarkers);
            });
        });
    }
    
    function showMapError() {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="alert alert-warning text-center p-5">
                    <i class="bi bi-map display-4 mb-3"></i>
                    <h4>Карта временно недоступна</h4>
                    <p>Для отображения карты необходим API ключ Яндекс.Карт</p>
                    <div class="mt-3">
                        <h5>Доступные ресурсы:</h5>
                        <ul class="text-start">
                            <li>Институт Конфуция МГУ - Ленинские горы, д. 1</li>
                            <li>Китайский культурный центр - ул. Правды, д. 1</li>
                            <li>Библиотека иностранной литературы - ул. Николоямская, д. 1</li>
                            <li>Языковой клуб "Восток" - ул. Арбат, д. 45</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    function updateMapMarkers() {
        // Получаем активные фильтры
        const activeFilters = {
            education: document.getElementById('filter-education').checked,
            libraries: document.getElementById('filter-libraries').checked,
            centers: document.getElementById('filter-centers').checked,
            cafes: document.getElementById('filter-cafes').checked
        };
        
        // Фильтруем ресурсы
        const filteredResources = resources.filter(resource => {
            const typeMap = {
                'education': 'education',
                'library': 'libraries',
                'center': 'centers',
                'cafe': 'cafes'
            };
            return activeFilters[typeMap[resource.type]];
        });
        
        // Удаляем старые метки
        if (map && map.geoObjects) {
            map.geoObjects.removeAll();
        }
        placemarks = [];
        
        // Добавляем новые метки
        filteredResources.forEach(resource => {
            if (!ymaps) return;
            
            const placemark = new ymaps.Placemark(
                resource.coordinates,
                {
                    balloonContentHeader: `<strong>${resource.name}</strong>`,
                    balloonContentBody: `
                        <p><strong>Адрес:</strong> ${resource.address}</p>
                        <p><strong>Часы работы:</strong> ${resource.workingHours}</p>
                        <p><strong>Контакты:</strong> ${resource.contact}</p>
                        <p><strong>Описание:</strong> ${resource.description}</p>
                        <p><strong>Услуги:</strong> ${resource.services}</p>
                    `,
                    balloonContentFooter: `<em>Тип: ${getResourceTypeName(resource.type)}</em>`,
                    hintContent: resource.name
                },
                {
                    preset: getPresetByType(resource.type),
                    iconColor: getColorByType(resource.type)
                }
            );
            
            placemarks.push(placemark);
            if (map) {
                map.geoObjects.add(placemark);
            }
        });
        
        // Если есть метки, подгоняем карту под них
        if (placemarks.length > 0 && map) {
            const bounds = ymaps.util.bounds.getBounds(
                placemarks.map(pm => pm.geometry.getCoordinates())
            );
            map.setBounds(bounds, {checkZoomRange: true});
        }
    }
    
    function getResourceTypeName(type) {
        const types = {
            'education': 'Образовательное учреждение',
            'library': 'Библиотека',
            'center': 'Культурный центр',
            'cafe': 'Языковое кафе'
        };
        return types[type] || 'Неизвестно';
    }
    
    function getPresetByType(type) {
        const presets = {
            'education': 'islands#blueEducationIcon',
            'library': 'islands#blueLibraryIcon',
            'center': 'islands#blueHomeIcon',
            'cafe': 'islands#blueCafeIcon'
        };
        return presets[type] || 'islands#blueStretchyIcon';
    }
    
    function getColorByType(type) {
        const colors = {
            'education': '#2A9D8F',
            'library': '#264653',
            'center': '#E9C46A',
            'cafe': '#F4A261'
        };
        return colors[type] || '#6c757d';
    }
    
    function searchOnMap() {
        const query = document.getElementById('map-search').value.trim();
        if (!query) return;
        
        if (!ymaps) {
            api.showNotification('Карта не загружена', 'warning');
            return;
        }
        
        // Используем геокодер Яндекса
        ymaps.geocode(query, {
            results: 10
        }).then(function(res) {
            const firstGeoObject = res.geoObjects.get(0);
            
            if (firstGeoObject) {
                // Удаляем старые поисковые метки
                map.geoObjects.each(function(geoObject) {
                    if (geoObject.properties.get('isSearchResult')) {
                        map.geoObjects.remove(geoObject);
                    }
                });
                
                // Добавляем новую метку
                const searchPlacemark = new ymaps.Placemark(
                    firstGeoObject.geometry.getCoordinates(),
                    {
                        balloonContent: firstGeoObject.getAddressLine(),
                        iconCaption: 'Результат поиска'
                    },
                    {
                        preset: 'islands#redDotIcon',
                        iconColor: '#DC3545'
                    }
                );
                
                searchPlacemark.properties.set('isSearchResult', true);
                map.geoObjects.add(searchPlacemark);
                
                // Перемещаем карту к результату
                map.setCenter(firstGeoObject.geometry.getCoordinates(), 15);
                
                // Открываем балун
                searchPlacemark.balloon.open();
                
                api.showNotification('Местоположение найдено', 'success');
            } else {
                api.showNotification('Местоположение не найдено', 'warning');
            }
        }).catch(function(error) {
            console.error('Geocoding error:', error);
            api.showNotification('Ошибка поиска', 'danger');
        });
    }
    
    // Запускаем инициализацию карты
    if (typeof ymaps !== 'undefined') {
        initMap();
    } else {
        // Если Яндекс.Карты не загружены, показываем ошибку через 2 секунды
        setTimeout(() => {
            if (typeof ymaps === 'undefined') {
                showMapError();
            } else {
                initMap();
            }
        }, 2000);
    }
});
