function setCookie(cName, cValue, expDays) {
    let date = new Date();
    date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
  }

function getCookie(name) {
    var cookieArr = document.cookie.split(';');
  
    for (var i = 0; i < cookieArr.length; i++) {
      var cookiePair = cookieArr[i].split('=');
      var cookieName = cookiePair[0].trim();
  
      if (cookieName === name) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null; // Return null if cookie not found
  }

function clearCookies() {
    document.cookie = "phoneNumber=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "sessionName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "codeHash=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}


function showFlashMessage(message) {
    var flashMessage = document.getElementById('flash-message');
    flashMessage.innerHTML = message;
    flashMessage.style.display = 'block';
    setTimeout(function() {
      flashMessage.style.display = 'none';
    }, 4000); // hide message after n seconds
  }

function loading_anim(){
    document.getElementById("continue_btn").style.display = "none";
    document.getElementById("loading_svg").style.display = "inline-block";
}

function h_loading_anim(){
    document.getElementById("loading_svg").style.display = "none";
    document.getElementById("continue_btn").style.display = "inline-block";
}

function validate(){
    pnumber = document.getElementById("login").value;
    if (!pnumber){
        showFlashMessage("no phone provided!");
        return;
    }
    loading_anim();
    fetch('/validate', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"phoneNumber": pnumber})
    })
        .then((response) => {
            return response.json();
        })
        .then((responseJson) => {
            if (responseJson['otp_sent']){
                setCookie("phoneNumber", responseJson['phoneNumber'].trim(), 1);
                setCookie("codeHash", responseJson['c_hash'], 1);
                setCookie("sessionName", responseJson['s_name'], 1);
                location.reload();
            }else{
                showFlashMessage(responseJson['response']);
                h_loading_anim();
            }
        })
}
const passwordInput = document.getElementById('password');
const showPassword = document.getElementById('showPassword');

showPassword.addEventListener('click', function() {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    showPassword.textContent = 'hide';
  } else {
    passwordInput.type = 'password';
    showPassword.textContent = 'show';
  }
});

function verify(){
    otp_input = document.getElementById("otp");
    code = otp_input.value;
    password = passwordInput.value
    if (!code){
        showFlashMessage("Enter OTP");
        return;
    }
    loading_anim();
    fetch("/authorize", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"code": code, "passwd": password})
    }).then((response) => {
        return response.json();
    }).then((responseJson) => {
        if (responseJson['logged_in']){
            showFlashMessage("Logged In! redirecting...");
            setCookie("token", getCookie("sessionName"), 365);
            clearCookies();
            location.href = "/"
        }else{
            showFlashMessage(responseJson['response']);
            if (responseJson['response'].includes("password is required")){
                otp_input.disabled = true;
                otp_input.style.color = "#808080";
                document.querySelector(".twofa").style.display = "block";
            }
            h_loading_anim();
        }
    })
}
