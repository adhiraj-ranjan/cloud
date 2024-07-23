## Telegram Cloud

# Further Development Stoppped

## What is this?
A Python Flask web application that uses Telegram as Cloud storage to store, retrieve and Share any amount of files upto 2 GB each. 
This also supports streaming for supported file types.
A robust,  modern and responseive Design for Devices with any screen size.

## Running Demo Instance
http://qk725g-8000.csb.app ⚠️

### Features to add
- [X] Faster Api response
- [ ] File Rename
- [ ] Adding Folders Support


## Installing Requirements
`pip install -r requirements.txt`


## Some Environment Vars are required
`api_id` and `api_hash` 
can be found at http://my.telegram.org and 

`fernet_key` for Encryption of url and data
can be generated using `dd if=/dev/urandom bs=32 count=1 2>/dev/null | openssl base64` in linux

## Running the Flask Server
`python main.py` 

NOTE : Although the Development Server is used, switching to production server should be straigh forward process.
### Find Me on :
<p align="left">
  <a href="https://github.com/adhiraj-ranjan" target="_blank"><img src="https://img.shields.io/badge/Github-adhiraj--ranjan-green?style=for-the-badge&logo=github"></a>
  <a href="https://www.instagram.com/adhirajranjan_" target="_blank"><img src="https://img.shields.io/badge/IG-adhiraj_ranjan-pink?style=for-the-badge&logo=instagram"></a>
  <a href="https://t.me/adhirajranjan" target="_blank"><img src="https://img.shields.io/badge/TELEGRAM-ADHIRAJ%20RANJAN-blue?style=for-the-badge&logo=telegram"></a>
  
</p>

## 📃 License
This project is under GPL-3.0 LICENSE

[![GitHub](https://img.shields.io/github/license/adhiraj-ranjan/cloud?style=for-the-badge)](https://github.com/adhiraj-ranjan/cloud/blob/main/LICENSE)
