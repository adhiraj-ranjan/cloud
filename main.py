from flask import Flask, render_template, request, jsonify, make_response, Response
import asyncio
import re
import urllib.parse
import utils.engine as engine
from waitress import serve

app = Flask(__name__)


@app.route("/", methods=["GET", "POST"])
def login_r():
    phoneNumber = request.cookies.get("phoneNumber")
    if phoneNumber:
        return render_template("verify_otp.html", cnCode=phoneNumber[:-10], unHiddenDigits=phoneNumber[-3:], pNum=phoneNumber)
    elif request.cookies.get("token"):
        return render_template("index.html")
    else:
        p = request.args.get("p")
        return render_template("login.html", pNum="+" + p.strip() if p else "")


@app.route("/validate", methods=['POST'])
def validate_phone():
    pNumber = request.get_json()['phoneNumber']
    # validate phone number
    if not pNumber.startswith("+"):
        if not len(pNumber) == 10:
            return jsonify({"status": "fail", "response": "invalid phone number", "otp_sent": False})
        else:
            pNumber = "+91" + pNumber
    # send otp
    try:
        c_hash, s_name = asyncio.run(engine.send_code(pNum=pNumber))
        return jsonify({"status": "ok", "otp_sent": True, "response": "otp sent successfully", "phoneNumber": pNumber, "c_hash": c_hash, "s_name": s_name})
    except Exception as e:
        return jsonify({"status": "fail", "response": str(e), "otp_sent": False})


@app.route("/authorize", methods=['POST'])
def check_creds():
    code = request.get_json()['code']
    passwd = request.get_json()['passwd']
    codeHash = request.cookies.get("codeHash")
    sessionName = request.cookies.get("sessionName")
    phoneNum = request.cookies.get("phoneNumber")
    # try sign in
    try:
        asyncio.run(engine.login(
            phoneNum, sessionName, codeHash, code, passwd))
        return jsonify({"status": "ok", "response": "logged in successfully", "logged_in": True})
    except Exception as e:
        return jsonify({"status": "fail", "response": str(e), "logged_in": False})


@app.route("/get_profile_name", methods=['POST'])
def get_name_r():
    token = request.cookies.get("token")
    try:
        profile_name = asyncio.run(engine.get_name(token))
        return jsonify({"profile_name": profile_name})
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route("/get_files", methods=['POST'])
def get_files_r():
    token = request.cookies.get("token")
    try:
        offset = request.get_json()['offset_id']
        file_listing = asyncio.run(
            engine.get_files(s_name=token, offset=offset))
        return jsonify(file_listing)
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route("/delete_file", methods=['POST'])
def delete_file_r():
    token = request.cookies.get("token")
    try:
        id = request.get_json()['id']
        asyncio.run(engine.delete_file(token, id))
        return jsonify({"status": "ok"})
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route("/logout", methods=['POST'])
def logout_r():
    token = request.cookies.get("token")

    try:
        asyncio.run(engine.logout(token))
    except:
        pass
    return jsonify({"status": "ok", "logged_out": True})


@app.route("/upload", methods=['POST'])
def upload():
    token = request.cookies.get("token")
    try:
        filename = request.headers.get('X-File-Name')
        filesize = request.headers.get('X-File-Size')
        f = urllib.parse.unquote(filename)
        asyncio.run(engine.upload_file(
            token, request.stream, f, fsize=int(filesize)))
        return jsonify({"status": "ok", "response": "file has been uploaded"})
    except Exception as e:
        return jsonify({"status": "fail", "response": str(e)})


@app.route("/search_files", methods=['POST'])
def search():
    token = request.cookies.get("token")
    try:
        offset = request.get_json()['offset_id']
        searchQuery = request.get_json()['query'].replace(
            ".", " ").encode('ascii', 'ignore').decode()
        search_listing = asyncio.run(
            engine.search_file(token, searchQuery, offset))
        return jsonify(search_listing)
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route("/download", methods=['POST'])
def download():
    token = request.cookies.get("token")
    file_id = request.form['id']

    g = engine.get_file_chunks(token, file_id)
    try:
        next(g)
        return Response(g, mimetype='application/octet-stream')
    except:
        return make_response(jsonify({"status": "not found"}), 404)


def parse_range_header(range_header, file_size):
    match = re.match(r'bytes=(\d+)-(\d+)?', range_header)
    if not match:
        raise ValueError('Invalid Range header format')
    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) else file_size - 1
    return start, end


def get_mtype(mtype):
    return "video/mp4" if mtype.split("/")[0] == "video" else mtype


@app.route("/stream")
def stream():
    token = request.cookies.get('token')
    file_id, m_type = request.args['id'], request.args['mime_type']
    length, fname = request.args['s'], request.args['n']

    # Check for Range header
    range_header = request.headers.get('Range')
    if range_header:
        try:
            start, end = parse_range_header(range_header, int(length))
            resp = Response(
                asyncio.run(engine.stream_chunks(
                    token, file_id, offset=start)),
                mimetype=get_mtype(m_type),
                status=206,  # Partial Content
            )
            resp.headers['Content-Range'] = f'bytes {start}-{end}/{length}'
        except ValueError:
            return make_response(jsonify({"status": "fail", "response": "Invalid Range Format"}), 400)
        except:
            return make_response(jsonify({"status": "not found"}), 404)
    else:
        byte_gen = engine.get_file_chunks(token, file_id)
        try:
            next(byte_gen)
        except:
            return make_response(jsonify({"status": "not found"}), 404)
        resp = Response(byte_gen, mimetype=get_mtype(m_type))

    resp.headers['Content-Length'] = length
    resp.headers.set('Content-Disposition', '',
                     filename=urllib.parse.quote(fname))
    return resp


def sendfile(token, f_id, m_type, f_length, f_name, stream):
    byte_gen = engine.get_file_chunks(token, f_id)
    try:
        next(byte_gen)
        resp = Response(byte_gen, mimetype=m_type)
        resp.headers['Content-Length'] = f_length
        if not stream:
            resp.headers.set('Content-Disposition', 'attachment',
                             filename=urllib.parse.quote(f_name))
        else:
            resp.headers.set('Content-Disposition', '',
                             filename=urllib.parse.quote(f_name))
        return resp
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route("/geturl", methods=['POST'])
def get_share_url():
    token = request.cookies.get('token')
    try:
        str = request.get_json()["string"]
        str += f"&t={token}"
        enc_str = engine.fernet.encrypt(str.encode()).decode()
        return jsonify({"status": "ok", "url": f"{request.url_root}file?id={enc_str}&stream=0"})
    except Exception:
        return make_response(jsonify({"status": "fail"}), 404)


@app.route("/file")
def get_file():
    id_str = request.args['id']
    stream = request.args['stream']
    try:
        query_string = engine.fernet.decrypt(id_str).decode()
        query_params = urllib.parse.parse_qs(query_string)
        return sendfile(token=query_params['t'][0], f_id=query_params['id'][0],
                        m_type=query_params['mime_type'][0], f_length=query_params['s'][0],
                        f_name=query_params['n'][0], stream=int(stream))
    except:
        return make_response(jsonify({"status": "not found"}), 404)


@app.route('/favicon.ico')
def favicon():
    return app.send_static_file("images/favicon.ico")


@app.route('/manifest.json')
def web_manifest():
    return app.send_static_file("manifest.json")


@app.route('/about')
def about():
    return render_template("about.html")


# app.run(host="0.0.0.0", threaded=True)
serve(app, host='0.0.0.0', port=8000)
