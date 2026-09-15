const taskCount = document.getElementById("taskCount");
const companyCount = document.getElementById("companyCount");
const textCount = document.getElementById("textCount");
const internshipCount = document.getElementById("internshipCount");


const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
const companies = JSON.parse(localStorage.getItem("companies")) || [];
const texts = JSON.parse(localStorage.getItem("texts")) || [];
const internships = JSON.parse(localStorage.getItem("internships")) || [];


taskCount.textContent = tasks.length;

companyCount.textContent = companies.length;

textCount.textContent = texts.length;

internshipCount.textContent = internships.length;