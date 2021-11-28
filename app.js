// import config from './config.js';

// DECLARING GLOBAL VARIABLES

const api_key = "6e79f73e4cb9aa56e0af03cbeb9c00c9";

let intervalId;

// GET CURRENT TIME

const getCurrentTime = (offset) => {
    let currentDate = new Date();
    let epoch = currentDate.getTime();

    // Create calendar date

    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1;
    let day = currentDate.getDate();

    // Create Day time
    let hour = currentDate.getUTCHours() + Number(offset);
    let ampm = hour < 12 ? 'AM' : 'PM';
    let minutes = currentDate.getMinutes < 10 ? `0${currentDate.getMinutes()}` : currentDate.getMinutes();
    let seconds = currentDate.getSeconds() < 10 ? `0${currentDate.getSeconds()}` : currentDate.getSeconds();
    let weekDay = currentDate.getDay();

    return {
        epoch,
        hour,
        minutes,
        seconds,
        year,
        month,
        day,
        weekDay,
        ampm,
    }
}

// GET CURRENT DATE

const getCurrentDate = () => {
    const currentDate = new Date();
    const options = { weekday: 'long', day: 'numeric', year: 'numeric', month: 'long' };
    const processedDate = currentDate.toLocaleDateString('en-EN', options);

    return processedDate;

}

// CONVERT UNIX TIMESTAMP TO DAYWEEK

const convertToDayWeek = (milliseconds) => {

    const ms = milliseconds * 1000;
    const dayWeek = new Date(ms).toLocaleDateString('en-US', { weekday: 'long' }).slice(0, 3).toUpperCase();

    return dayWeek;

}

// RENDER CURRENT DATE TO UI

const displayCurrentDate = (offset) => {

    intervalId = setInterval(() => {

        // Get current time and date
        let { hour, minutes, ampm } = getCurrentTime(offset);
        const time = document.querySelector('.time__current');
        const currentDate = document.querySelector('.header__current-date');

        // Insert formated time and date into html
        time.innerText = `${hour <= 12 ? hour : hour - 12}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`;
        currentDate.innerText = getCurrentDate();


    }, 1000);

}

// LOAD CITIES DATA INCLUDING COORDS

const fetchCitiesData = async (location) => {
    try {
        let response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=5&appid=${api_key}`);
        let data = response.json();
        return data

    } catch (err) {

        console.log('Error: ', err)

    }

}

// CREATE CITY ROW

const createCityRowHtml = (city) => {
    return `
<li class="search__city-row" data-id="${city.id}"><span class="search__city">${city.name}, ${city.country}</span><span class="search__coord">${Number(city.lat).toFixed(4)}, ${Number(city.lon).toFixed(4)}</span></li>
`}

// CREATE CITY LIST PROMPT

const createCitiesPromptList = (cities) => {
    let output = "";
    const searchContainer = document.querySelector('.search__wrapper');
    const cityList = document.querySelector('.search__dropdown-menu');

    if (cityList) { cityList.parentNode.removeChild(cityList); };

    const ul = document.createElement('ul');

    ul.classList.add('search__dropdown-menu');

    cities.forEach(city => {
        output += createCityRowHtml(city);
    });

    ul.innerHTML = output;
    searchContainer.appendChild(ul);

}

// FIND WCHITCH CITY USER CHOOSE

const findUserOption = (e) => {
    let coords;

    e.target.tagName === 'SPAN' ? coords = e.target.parentNode.lastChild.textContent : coords = e.target.lastChild.textContent;

    const processedCoords = coords.split(',');
    const [latitude, longitude] = processedCoords;
    const locationCoords = {
        latitude: Number(latitude),
        longitude: Number(longitude)
    };
    return locationCoords;
}

// CHANGE UI LOCATION 

const findUserCityId = (event, cities) => {
    const cityId = event.target.parentNode.dataset.id;
    const city = cities.find(city => city.id == cityId);

    return city
}

// GET CITY COORDS SELECTED BY USER IN SEARCH FIELD

const getCity = async (location) => {

    if (!location) return;

    // Get cities data using openweather reverse geocoding api

    let cities = await fetchCitiesData(location);

    if (cities.length == 0) { alert('Bad location, please try once agait') };

    // Add id to every city object

    cities.map((city, index) => { return city.id = index; });

    // Create cities list prompt 

    createCitiesPromptList(cities);

    const citiesList = document.querySelector('.search__dropdown-menu');

    citiesList.addEventListener('click', async (e) => {

        const locationData = await fetchData(findUserOption(e));

        // Change location
        const { name, country } = findUserCityId(e, cities);
        document.querySelector('.card__location-text').textContent = `${name}, ${country}`;

        // Change timeoffset from seconds to hours
        const timeZoneOffset = locationData.timezone_offset / 3600;

        // Clear running interval using interval ID

        clearInterval(intervalId);

        // Render date and time

        displayCurrentDate(timeZoneOffset);

        // Display data for selected location

        displayWeatherData(locationData);

        // Remove citylist prompt
        citiesList.style.display = "none";

    });

    document.querySelector('.search__input').classList.add('search__input--border-disabled');

    // Clear previous value

    document.querySelectorAll('.card__space').forEach(el => el.textContent = '');
    const input = document.querySelector('.search__input');
    input.value = "";

    // Remove border from input
    document.querySelector('.search__input').classList.remove('search__input--border-disabled');
}


const searchButton = document.querySelector('.search__button');

// Add listener on searchbutton to detect user input value

searchButton.addEventListener('click', function (e) {
    const input = document.querySelector('.search__input').value;
    getCity(input);
});


// FETCH API_URL

const fetchData = async (location) => {

    try {

        // Use one-call api taking location as a query parameter

        let response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${location.latitude}&lon=${location.longitude}&units=metric&exclude=minutely,hourly,alerts&appid=${api_key}`)
        let data = await response.json();

        return data;

    } catch (err) {

        console.log('Error: ', err);

    }

}

// GET USER COORDINATES USING BROWSER GEOLOCATION API

const getCoords = async () => {

    // Get user location coords 

    const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
            enableHighAccuracy: true,
            timeout: 5000
        });

    })

    const { latitude, longitude } = pos.coords;

    return { latitude, longitude };

}


// CREATE DAY-ROW WEATHER TEMPLATE

const showNextDaysWeather = (el) => {
    return `<li class="upcomming-forecast__row">
   <span class="upcomming-forecast__day">${convertToDayWeek(el.dt)}</span>
     <div class="upcomming-forecast__values">
     <img src="SimplifiedWeather/temporaryicons/weather/${el.weather[0].icon}.png" alt="" class="upcomming-forecast__image">
     <span class="upcomming-forecast__temperatures">${Math.round(el.temp.max)}°/${Math.round(el.temp.min)}°</span>
     </div>
     </li>`
}

// RENDERING NEXT DAYS WEATHER

const renderNextDaysWeather = (data) => {
    const nexDayWeatherData = data.daily.slice(1, 8);
    let list = document.querySelector('.card__forecast-list');
    let output = "";

    nexDayWeatherData.forEach(element => {
        output += showNextDaysWeather(element);

    });

    // Append data to html

    list.innerHTML = output;

}

// MAKE FIRST LETTER STARTS UPPERCASE

const firstLetterToUpperCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// DISPLAY MAIN DATA FROM API TO THE USER

const displayWeatherData = (data) => {
    const btn = document.querySelector('.card__btn');
    const temperature = document.querySelector('.card__temperature');
    const weatherDescription = document.querySelector('.card__weather');
    const lowestTemperature = document.querySelector('.card__min-value ');
    const highestTemperature = document.querySelector('.card__max-value');
    const pressure = document.querySelector('.card__pressure-value');
    const humidity = document.querySelector('.card__humidity-value');
    const dew = document.querySelector('.card__dew-value');
    const visibility = document.querySelector('.card__visibility-value');
    const uv = document.querySelector('.card__uv-value');
    const precipitation = document.querySelector('.card__precipitation-value');
    const wind = document.querySelector('.card__wind-value');

    // Clear previous values

    document.querySelectorAll('.card__space').forEach(el => el.textContent = '');

    // Insert weather data for user location

    temperature.innerText = `${Math.round(data.current.temp)}°`;
    highestTemperature.insertAdjacentText('beforeend', `${Math.round(data.daily[0].temp.max)}°`);
    lowestTemperature.insertAdjacentText('beforeend', `${Math.round(data.daily[0].temp.min)}°`);
    humidity.insertAdjacentText('beforeend', `${data.current.humidity}%`);
    wind.insertAdjacentText('beforeend', `${data.current.wind_speed}m/s`);
    precipitation.insertAdjacentText('beforeend', `${data.daily[0].rain ? `${data.daily[0].rain}` : 'N/A'}`);
    uv.insertAdjacentText('beforeend', `${data.current.uvi}`);
    visibility.insertAdjacentText('beforeend', `${data.current.visibility}m`);
    dew.insertAdjacentText('beforeend', `${data.current.dew_point}`);
    pressure.insertAdjacentText('beforeend', `${data.current.pressure}hPa`);
    weatherDescription.innerText = firstLetterToUpperCase(data.current.weather[0].description);

    // Set input hide/open condition to false (hide)

    let isOpen = false;

    btn.addEventListener('click', () => {
        const list = document.querySelector('.card__details-list');

        // Close/Hide 'details' button

        isOpen = !isOpen;

        if (isOpen) {
            btn.textContent = 'hide'
            list.classList.toggle('card__details-list--isOpen');
        }
        else {
            btn.textContent = 'details';
            list.classList.toggle('card__details-list--isOpen');
        }

    });

    // Render weather for next seven days

    renderNextDaysWeather(data);

};


const geocodingApiResponse = async (lat, lon) => {
    const geocodingUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${api_key}`;
    try {
        const response = await fetch(geocodingUrl);
        const data = response.json();
        return data;
    }

    catch (err) {
        console.log(err);
    }
};

// GET USER LOCATION DATA

const askUserLocationData = async () => {

    // Ask for geolocation Permision

    const result = confirm('Do you want to share your location?');

    if (!result) return;

    // Set user coords using geolocation and fetch data from api 

    const coords = await getCoords();
    const userLocationData = await fetchData(coords);

    // Get user location data from api

    const { lat, lon } = userLocationData;
    const city = await geocodingApiResponse(lat, lon);

    // Set user location in UI

    document.querySelector('.card__location-text').textContent = `${city[0].name}, ${city[0].country}`;

    // Get user timezone offfset

    const timeZoneOffset = userLocationData.timezone_offset / 3600;

    // Display time for specific location including timezone offset 

    clearInterval(intervalId);

    // Display date

    displayCurrentDate(timeZoneOffset);

    // Display weather for user location
    displayWeatherData(userLocationData);
}

window.addEventListener('DOMContentLoaded', async (e) => {

    // Clear input value

    const input = document.querySelector('.search__input');
    input.value = "";

    // Set user coords and display weather data

    askUserLocationData();
});



