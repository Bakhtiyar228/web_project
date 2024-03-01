document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const editProfileBtn = document.getElementById('editprofile');
    const saveChangesBtn = document.getElementById('savechanges');
    const spinner = document.getElementById('spinner');
    const accountDetailsContainer = document.getElementById('accountDetailsContainer');
    const avatarchange = document.getElementById('avatarchange');
    const userData = {
        fname: localStorage.getItem('fname'),
        sname: localStorage.getItem('sname'),
        job: localStorage.getItem('job'),
        city: localStorage.getItem('city'),
        email: localStorage.getItem('email'),
        birthday: localStorage.getItem('birthday')
    };
    let base64Image, deleted, newAboutMe;

    if(!token){
        window.location.replace('/');
    }
    else {
        document.getElementById('profileusername').textContent = localStorage.getItem('username'); 
        const base64Avatar = localStorage.getItem('avatar');
        document.getElementById('avatarprofile').src = `data:image/png;base64, ${base64Avatar}`;
        const storedUserData = JSON.parse(localStorage.getItem('userData'));
        if (storedUserData) {
            alert(storedUserData.sname)
            updateHTMLPage(storedUserData);
        } 
         const Aboutmetext =  localStorage.getItem('aboutme');
        if (Aboutmetext) {
            document.getElementById('aboutmetext').textContent = `${Aboutmetext}`;
        } 
        else {
            fetchAboutMe(username);
        }

        editProfileBtn.addEventListener('click', () => {
            editProfileBtn.classList.add('hide');
            saveChangesBtn.classList.remove('hide');
            avatarchange.classList.remove('hide');
            Array.from(accountDetailsContainer.querySelectorAll('p.card-header')).forEach(p => {
                p.classList.add('hide');
            });
            Array.from(accountDetailsContainer.querySelectorAll('.form-control.hide')).forEach(input => {
                input.classList.remove('hide');
            });
            document.getElementById('change_aboutme').classList.remove('hide');
            document.getElementById('change_aboutme').placeholder = Aboutmetext ? Aboutmetext : "Enter your about me text here";
            document.getElementById('savechanges').classList.remove('hide');
        });

        document.getElementById('avatarInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
          base64Image = e.target.result; 
          base64Image = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');};
          reader.readAsDataURL(file); 
        } } );

        document.getElementById('deleteavatar').addEventListener('click', () => {
          document.getElementById('deleteresult').style.display = 'block';
          deleted = true;
          localStorage.removeItem('avatar'); 
        })
        
        document.getElementById('change_aboutme').addEventListener('change', function(event) {
          newAboutMe = document.getElementById('change_aboutme').value; } );

        saveChangesBtn.addEventListener('click', () => {
          saveChangesBtn.classList.add('hide');
          spinner.classList.remove('hide');
          setTimeout(() => {
            editprofile.style.display = 'block';    
            spinner.classList.add('hide');
            if (base64Image) {
                uploadAvatar(base64Image);
            } else {
                const currentAvatar = localStorage.getItem('avatar');
                uploadAvatar(currentAvatar);
            }
            if (newAboutMe) {
                updateAboutMe(newAboutMe);
            } else {
                updateAboutMe(Aboutmetext);
            }
            if(deleted == true){
                deleteAvatar(username);
                localStorage.setItem(base64Avatar, `${getDefaultAvatar()}`)
            }
            Array.from(accountDetailsContainer.querySelectorAll('.form-control:not(.hide)')).forEach(input => {
                input.classList.add('hide');
            });
            Array.from(accountDetailsContainer.querySelectorAll('p.card-header')).forEach(p => {
                p.classList.remove('hide');
            });
            document.getElementById('deleteavatar').style.display='none';
            
            updateHTMLPage(); 
            sendToMongoDB();
            window.location.reload();
            }, 2000);
            });
} });

function updateHTMLPage(storedUserData) {
    const userDataKeys = ['fname', 'sname', 'job', 'city', 'email', 'birthday'];
    userDataKeys.forEach(key => {
        const element = document.getElementById(key);
        if (storedUserData[key]) {
            element.textContent = storedUserData[key];
        } else {
            element.textContent = 'No information';
        }
    });
}

function sendToMongoDB() {
    localStorage.removeItem('userData'); 
    const userData = {
        fname: document.getElementById('inputFirstName').value,
        sname: document.getElementById('inputLastName').value,
        job: document.getElementById('inputJobName').value,
        city: document.getElementById('inputCity').value,
        email: document.getElementById('inputEmail').value,
        birthday: document.getElementById('inputBirthday').value
    };
    const username = localStorage.getItem('username'); 
    fetch('/updateUserData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, userData: userData })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to update information');
    })
    .catch(error => {
        console.error('Error updating information:', error);
    });
    localStorage.setItem('userData', JSON.stringify(userData));
}

async function fetchAboutMe(username) {
    try{
        const response = await fetch(`/getaboutme?username=${username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch information');
        }
        const aboutme = await response.text(); 
        document.getElementById('aboutmetext').textContent = `${aboutme}`;
        localStorage.setItem('aboutme', aboutme);
    } catch (error) {
        console.error('Error fetching "about me" information:', error);
    }
}

async function updateAboutMe(newAboutMe) {
    localStorage.removeItem('aboutme'); 
    const username = localStorage.getItem('username'); 
    fetch('/updateAboutMe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, newAboutMe: newAboutMe })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to update information');
    })
    .catch(error => {
        console.error('Error updating information:', error);
    });
    localStorage.setItem('aboutme', newAboutMe);
}

function uploadAvatar(base64Image) {
    const username = localStorage.getItem('username'); 
    fetch('/updateAvatar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, avatar: base64Image })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to update avatar');
    })
    .then(data => {
        console.log('Avatar updated successfully:', data);
    })
    .catch(error => {
        console.error('Error updating avatar:', error);
    });
    localStorage.setItem('avatar', base64Image);
}

async function deleteAvatar(username) {
    try {
        const response = await fetch(`/deleteAvatar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username })
        });
        if (!response.ok) {
            throw new Error('Failed to delete avatar');
        }
        localStorage.removeItem('avatar');
    } catch (error) {
        console.error('Error deleting avatar:', error);
    }
}

async function getDefaultAvatar() {
    try {
        const response = await fetch(`/getDefaultAvatar`);
        if (!response.ok) {
            throw new Error('Failed to fetch avatar');
        }
        const imageData = await response.text(); 
        document.getElementById('avatar').src = `data:image/png;base64, ${imageData}`;
        document.getElementById('avatarprofile').src = `data:image/png;base64, ${imageData}`;
        base64Avatar = localStorage.setItem('avatar', imageData);
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}