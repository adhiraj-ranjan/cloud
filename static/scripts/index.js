// Open upload dialog box
function openUploadDialog() {
    document.getElementById("upload-dialog").style.display = "block";
}

// Close upload dialog box
function closeUploadDialog() {
    document.getElementById("upload-dialog").style.display = "none";
}

// clear cookies
function clearCookies() {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// get cookie value
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

// render flash message
function showFlashMessage(message) {
    var flashMessage = document.getElementById('flash-message');
    flashMessage.innerHTML = message;
    flashMessage.style.display = 'block';
    setTimeout(function() {
      flashMessage.style.display = 'none';
    }, 4000); // hide message after n seconds
}

// file icons path declearation
var iconJson = {
    "application/zip": "../static/file_icos/zip.png",
    "others": "../static/file_icos/file.svg",
    "text/x-python": "../static/file_icos/python.png",
    "image/png": "../static/file_icos/photo.png",
    "image/jpeg": "../static/file_icos/photo.png",
    "text/plain": "../static/file_icos/document.png",
    "application/pdf": "../static/file_icos/pdf.png",
    "text/csv": "../static/file_icos/csv.png",
    "application/vnd.ms-excel": "../static/file_icos/csv.png",
    "application/octet-stream": "../static/file_icos/octet.png",
    "application/vnd.android.package-archive": "../static/file_icos/apk.png",
    "video/mp4": "../static/file_icos/video.png",
    "video/x-matroska": "../static/file_icos/video.png",
    "audio/mpeg": "../static/file_icos/audio.svg"
}

// update profile name on page
function update_name(){
    fetch('/get_profile_name', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
    })
        .then((response) => {
            if (response.ok){
                return response.json();
            }else if (response.status === 404){
                logout();
                throw new Error(response.statusText);
            }
        })
        .then((responseJson) => {
            document.getElementById("pname").innerHTML = "logged in as " + responseJson['profile_name'];
        })
        .catch(error => {
            // handle any error that occurred during the request
            console.error(error);
          });
}
update_name()


// render context Menu
const contextMenu = document.querySelector(".wrapper");
// define confirm delete and delete button
var confirm_delete = document.getElementById("confirm_delete");
var delete_btn = document.getElementById("delete_btn_cnf")

var span_id, parent_tr;

function update_contextMenu_params(e){
    parent_tr = e.srcElement.closest("TR");
    span_id = parent_tr.id;
}

function show_confirm_delete(){
    confirm_delete.style.display = "none";
    delete_btn.style.display = "flex";
}

function hide_confirm_delete(){
    delete_btn.style.display = "none";
    confirm_delete.style.display = "flex";
}

function contextMenuEvent(e){
    e.preventDefault();
    update_contextMenu_params(e);

    var x = e.clientX, y = e.clientY;
    var maxX = window.innerWidth;
    var maxY = window.innerHeight;
    
    hide_confirm_delete();

    // make contextMenu visible
    contextMenu.style.display = "block";
    // Adjust the position of the context menu if it would flow out of the screen
    var menuWidth = contextMenu.offsetWidth + 5;
    var menuHeight = contextMenu.offsetHeight + 5;
    if (x + menuWidth > maxX) {
        x = maxX - menuWidth;
    }
    if (y + menuHeight > maxY) {
        y = maxY - menuHeight;
    }
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
};

function low_row_opacity(element){
    element.style.backgroundColor = "#161b22"
    element.style.opacity = "0.5";
}

function del_file(){
    var tr_element = parent_tr;
    var id = span_id;
    low_row_opacity(tr_element);
    fetch('/delete_file', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"id": id})
    }).then((response) => {
        if (response.ok){
            tr_element.remove(); // remove file from file listing
        }else if (response.status === 404){
            logout();
            throw new Error(response.statusText);
        }
    }).catch(error => {
        // handle any error that occurred during the request
        console.error(error);
      });
}

// hide context menu on click if visible
document.addEventListener("click", function(event){
    if (contextMenu.style.display != "none"){ 
        if (!(event.target.parentNode.id == "confirm_delete" || event.target.id == "confirm_delete")){
            contextMenu.style.display = "none";
        }
    }
});

// handle mobile dropdown function
const dropdownButton = document.getElementById('dropdown');
const dropdownContent = document.querySelector('.download_area');

dropdownButton.addEventListener('click', function() {
    dropdownContent.classList.toggle('active');
});

// download implementation
var downloadArea = document.querySelector(".download_area");
function downloadFile(){
    const formData = new FormData();
    formData.append('id', span_id);

    let downloadname = parent_tr.childNodes[0].title;
    let downloadsize = parent_tr.childNodes[1].getAttribute("inbytes");
    let downloadsizeformat = parent_tr.childNodes[1].innerHTML;
    
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';

    showFlashMessage("Download Started");
    downloadArea.insertAdjacentHTML("afterbegin", `<div class="download-styling">
                                                        <div class="download-progress-text">
                                                            <span>${(downloadname.length < 15) ? downloadname : downloadname.substring(0, 10) + "..." + downloadname.substring(downloadname.length, downloadname.length-5)}</span>
                                                            <span class="downloadPercent">0%</span>
                                                        </div>
                                                        <div class="progress-container">
                                                            <div class="downloadBar"></div>
                                                        </div>
                                                        <div class="download-status-text">
                                                            status : <span class="download_status">in progress<span>
                                                        </div>
                                                        <div class="download-status-text">
                                                            size : ${downloadsizeformat}
                                                        </div>
                                                        <div class="cancel_btn" onmouseover="this.style.color='orange';" onmouseout="this.style.color='';">
                                                            Cancel Download
                                                        </div>
                                                    </div>`);
    
    if (!dropdownContent.classList.contains('active')){
        dropdownButton.click();
    }
    let downloadPercent = document.querySelector(".downloadPercent");
    let downloadBar = document.querySelector(".downloadBar");
    let downloadStatus = document.querySelector(".download_status");
    let cancel_btn = document.querySelector(".cancel_btn");

    xhr.addEventListener('progress', event => {
        const progress = Math.round((event.loaded / parseInt(downloadsize)) * 100);
        downloadPercent.innerHTML = progress + "%";
        downloadBar.style.width = progress + "%";
    });

    xhr.open('POST', "/download", true);
    xhr.send(formData);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 && downloadBar.style.width == "100%") {
                const blob = xhr.response;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadname;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                // update download status
                downloadStatus.innerHTML = "downloaded"
                downloadStatus.style.color = "#81B622"
                cancel_btn.remove()
            }
             else {
                showFlashMessage("Download failed");
                downloadStatus.innerHTML = "failed"
                downloadStatus.style.color = "#D70040"
                cancel_btn.remove()
            }
        }
    }  

    cancel_btn.addEventListener('click', function() {
        if (downloadBar.style.width == "100%"){
            showFlashMessage("File has been downloaded, Waiting for response!")
        }else{
            xhr.abort();
        }
      });
}

// file streaming request
function stream_req(){
    mime_type = parent_tr.childNodes[0].childNodes[1].childNodes[2].innerText;
    downsize = parent_tr.childNodes[1].getAttribute("inbytes");
    fname = parent_tr.childNodes[0].title;
    window.open("/stream?id=" + span_id + "&mime_type=" + mime_type + "&s=" + downsize + "&n=" + fname, "_blank");
}


var tbody = document.querySelector(".file-listing table tbody");
var nofilestext = document.getElementById("nofilestext");
var fload = document.getElementById("floadsvg");

function show_fileload_anim(){
    nofilestext.style.display = "none";
    fload.style.display = "flex";
}

function hide_fileload_anim(){
    fload.style.display = "none";
}

// Function to populate the file listing table
function populateFileListing(files, offset) {
    if (!files.length && !offset){
        nofilestext.style.display = "block";
    } // handle no files text message
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var row = document.createElement("tr");
        row.id = file.id;
        // create file name and type
        var fname = document.createElement("td")
        fname.title = file.name;
        // craete file icon element and append to fname
        var ico = document.createElement("img");
        ico.alt = "ico"
        ico.src = iconJson.hasOwnProperty(file.type) ? iconJson[file.type] : iconJson["others"]
        var imgdiv = document.createElement("div") // craeting div for icon
        imgdiv.style.marginRight = "15px";
        imgdiv.appendChild(ico);
        fname.appendChild(imgdiv);
        // creating a div for filename and type
        fdiv = document.createElement("div");
        fdiv.className = "finfo";
        // append 1st span name to div --> fdiv
        var span1 = document.createElement("span")
        span1.innerHTML = file.name;
        fdiv.appendChild(span1);
        fdiv.append(document.createElement("br"))
        // append 2nd span type to div --> fdiv
        var span2 = document.createElement("span")
        span2.className = "ftype";
        span2.innerHTML = file.type;
        fdiv.appendChild(span2);
        // append fdiv to fname
        fname.appendChild(fdiv);
        // craete file size element
        var fsize = document.createElement("td");
        fsize.setAttribute("inbytes", file.size)
        fsize.innerHTML = formatBytes(file.size);
        // create file time element
        var ftime = document.createElement("td");
        ftime.innerHTML = file.time
        // append all to row --> tr
        row.appendChild(fname);
        row.appendChild(fsize);
        row.appendChild(ftime);
        row.addEventListener("contextmenu", contextMenuEvent, false); // add contextMenu event listener
        tbody.appendChild(row);
    }
}

// controlling function to occur after avery n milliseconds
function debounce(func, delay) {
    var timer;
    return function() {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        func.apply(context, args);
      }, delay);
    };
}

let controller = new AbortController();
let isFetching = false;
let isSearching = false;

var fileupdate = document.getElementById("files");
// Populate the file listing on page load --> update files
function updateFiles(offset_id=0){
    show_fileload_anim();

    controller.abort();
    controller = new AbortController();
    fetch('/get_files', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"offset_id": offset_id}),
        signal: controller.signal
    })
        .then((response) => {
            isFetching = false;
            if (response.ok){
                return response.json();
            }else if (response.status === 404){
                logout();
                throw new Error(response.statusText);
            }
        })
        .then((responseJson) => {
            hide_fileload_anim();
            populateFileListing(responseJson, offest=offset_id);
            if (responseJson.length < 20){
                fileupdate.className = "1";
            }else{
                fileupdate.className = responseJson[responseJson.length-1].id;
            }
        })
        .catch(error => {
            if (error.name === "AbortError") {
              // Ignore aborted fetch requests
            } else {
                hide_fileload_anim();
                console.error(error);
            }
          });
    }

updateFiles();


function searchFiles(query, offset_id=0){
    show_fileload_anim();

    controller.abort();
    controller = new AbortController();
    fetch('/search_files', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"offset_id": offset_id, "query": query}),
        signal: controller.signal
        })
        .then((response) => {
            isSearching = false;
            if (response.ok){
                return response.json();
            }else if (response.status === 404){
                logout();
                throw new Error(response.statusText);
            }
        })
        .then((responseJson) => {
            hide_fileload_anim();
            populateFileListing(responseJson, offest=offset_id);
            if (responseJson.length < 20){
                fileupdate.className = "1";
            }else{
                fileupdate.className = responseJson[responseJson.length-1].id;
            }
        })
        .catch(error => {
            if (error.name === "AbortError") {
              // Ignore aborted fetch requests
            } else {
                hide_fileload_anim();
                console.error(error);
            }
        });
}

// handle scroll --> load files on scroll
var list = document.getElementById("fileScrollDiv");
var section = document.querySelector(".sections");
function handleScroll() {
    if (contextMenu.style.display != "none"){ 
        contextMenu.style.display = "none";
    }
    if (list.scrollTop + list.clientHeight >= list.scrollHeight-1000 && !(fileupdate.className=="1")){
        if (list.getElementsByTagName("tbody")[0].childNodes.length){
            const searchQuery = searchInput.value;
            id = fileupdate.className;
            if (searchQuery){
                if (!isSearching){
                    isSearching = true;
                    searchFiles(searchQuery, offset_id=parseInt(id));
                }
            }
            else if (!isFetching) {
                isFetching = true;
                updateFiles(parseInt(id));
            }
        }
    }
}

list.addEventListener("scroll", handleScroll);
section.addEventListener("scroll", handleScroll);

const searchInput = document.querySelector(".search-input");
function update_file_index(){
    const searchQuery = searchInput.value;
    tbody.innerHTML = "";
    if (searchQuery){
        searchFiles(searchQuery);
    }else{
        updateFiles();
    }
}

function handleSearch() {
    update_file_index();
};
searchInput.addEventListener("input", debounce(handleSearch, 300));



// logout function
function logout(){
    document.getElementById("pname").innerHTML = "logging out...";
    fetch('/logout', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
    })
        .then((response) => {
            clearCookies();
            location.reload()
        })
}

var rotationAngle = 0;
function refresh_files(){
    rotationAngle += 180;
    document.querySelector(".refresh_btn").style.transform = "rotate(" + rotationAngle + "deg)";
    update_file_index();
}

function get_share_url(){
    mime_type = parent_tr.childNodes[0].childNodes[1].childNodes[2].innerText;
    downsize = parent_tr.childNodes[1].getAttribute("inbytes");
    fname = parent_tr.childNodes[0].title;
    str = "id=" + span_id + "&mime_type=" + mime_type + "&s=" + downsize + "&n=" + fname
    fetch('/geturl', {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({"string": str}),
        signal: controller.signal
        })
        .then((response) => {
            if (response.ok){
                return response.json();
            }else{
                throw new Error(response.statusText);
            }
        })
        .then((responseJson) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(responseJson["url"]).then(() => {
                    showFlashMessage("Share link copied");
                  }, () => {
                    showFlashMessage("Failed to copy");
                  });
            } else {
                  const textarea = document.createElement('textarea');
                  textarea.value = responseJson["url"];
                  document.body.appendChild(textarea);
                  textarea.select();
                  try {
                    document.execCommand('copy');
                    showFlashMessage("Share link copied");
                  } catch (err) {
                    showFlashMessage("Failed to copy");
                  }
                  document.body.removeChild(textarea);
            }
        })
        .catch(error => {
            showFlashMessage("Failed to get share link");
            console.error(error);
        });
}
function formatBytes(bytes, decimals=2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

var fileInput = document.querySelector(".file-input");
var uploadButton = document.getElementById("upload_btn");
var uploadSvg = document.getElementById("uploading_svg");
var progressArea = document.querySelector(".progress-area");
var uploadedArea = document.querySelector(".uploaded-area");
var uploadingInfo = document.querySelector(".uploading-info");
var fileCount = document.getElementById("fcount");
var cancelOUploads = document.getElementById("ofuploadcancel");

let isCancelled = false;

function uploading_anim_start(){
    uploadButton.style.display = "none";
    uploadSvg.style.display = "flex";
    uploadingInfo.style.display = "flex";
}

function uploading_anim_stop(){
    uploadSvg.style.display = "none";
    uploadButton.style.display = "flex";
    uploadingInfo.style.display = "none";
}

function update_upload_info(l, i){
    fileCount.innerHTML = l - i
    if ((l - i) > 1){
        cancelOUploads.style.display = "block";
    }else{
        cancelOUploads.style.display = "none";
    }
}

function reset_form(){
    isCancelled = false;
    fileInput.value = '';
}

cancelOUploads.addEventListener('click', () => {
    isCancelled = true;
    update_upload_info(1, 0);
});


uploadButton.addEventListener("click", ()=>{
    fileInput.click()
});
fileInput.onchange = async ({target}) =>{
    let files = target.files;
    if (files.length > 0) {
        uploading_anim_start();
        for (let i = 0; i < files.length; i++) {
            update_upload_info(files.length, i);
            let file = files[i];
            await uploadFile(file, file.name, file.size);
            if (isCancelled) {
                i = files.length - 1;
            }
        }
        uploading_anim_stop();
        update_file_index();
    }
    reset_form();
}

function uploadFile(file, rFilename, fsize){
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload", true)
        xhr.setRequestHeader('X-File-Name', encodeURIComponent(rFilename));
        xhr.setRequestHeader('X-File-Size', fsize);
        if (rFilename.length >= 60){
            fname = rFilename.substring(0, 55) + "..." + rFilename.substring(rFilename.length, rFilename.length-5);
        }else{fname=rFilename}
        progressArea.innerHTML = `<li class="row prow">
                                        <img src="../static/images/file-upload.svg">
                                        <div class="content">
                                            <div class="details">
                                                <span class="name">${fname} • Uploading</span>
                                                <span class="percent" id="uploading-percent">0%</span>
                                            </div>
                                            <div class="progress-bar">
                                                <div class="progress" id="uploadingbar"></div>
                                            </div>
                                        </div>
                                        <div title="cancel upload" class="cancel_upload">
                                            <img src="../static/images/cancel.png">
                                        </div>
                                    </li>`;
        var progress = document.getElementById("uploading-percent");
        var progressbar = document.getElementById("uploadingbar");
        let fileSize = formatBytes(fsize);
    
        let uploadedHTML = `<li class="row">
                                        <div class="content">
                                            <img src="../static/images/file-upload.svg">
                                            <div class="details">
                                                <span class="name">${fname}</span>
                                                <span class="size">${fileSize}</span>
                                            </div>
                                        </div>`
        let uploadedHTMLRes = {"success": uploadedHTML + `
                                                    <img src="../static/images/checkmark.svg">
                                                </li>`,
                            "fail": uploadedHTML + `
                                                    <img src="../static/images/cross.png">
                                                </li>`}
    
        xhr.upload.addEventListener("progress", ({loaded, total}) =>{
            let fileLoaded = Math.floor((loaded / total) * 100);
            progress.innerHTML = fileLoaded + "% of " + fileSize;
            progressbar.style.width = fileLoaded + "%";
    
        });
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                progressArea.innerHTML = "";
                if (xhr.status === 200) {
                    if (JSON.parse(xhr.responseText)['status'] == "ok"){
                        uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTMLRes['success']);
                    }else{
                        uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTMLRes['fail']);
                        showFlashMessage("Upload failed");
                    }
                } else {
                    uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTMLRes['fail']);
                    showFlashMessage("Upload failed");
                }
                resolve();
            }
    };
        xhr.send(file)
        document.querySelector('.cancel_upload').addEventListener('click', function() {
            if (progressbar.style.width == "100%"){
                showFlashMessage("File is already uploaded, waiting for response!")
            }else{
                xhr.abort();
            }
          });
    });
}