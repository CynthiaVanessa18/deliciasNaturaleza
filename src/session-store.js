import session from 'express-session';
import { getPool, sql } from './db.js';
export class SqlSessionStore extends session.Store {
  get(sid, callback) {
    getPool().then(pool => pool.request().input('id', sql.VarChar(128), sid)
      .query('SELECT Data FROM Sessions WHERE Id=@id AND ExpiresAt>SYSUTCDATETIME()'))
      .then(result => callback(null, result.recordset[0] ? JSON.parse(result.recordset[0].Data) : null)).catch(callback);
  }
  set(sid, value, callback = () => {}) {
    getPool().then(pool => pool.request().input('id', sql.VarChar(128), sid)
      .input('data', sql.NVarChar(sql.MAX), JSON.stringify(value))
      .input('expires', sql.DateTime2, new Date(value.cookie.expires || Date.now() + 28800000))
      .query(`MERGE Sessions WITH (HOLDLOCK) AS target USING (SELECT @id AS Id) AS source ON target.Id=source.Id
        WHEN MATCHED THEN UPDATE SET Data=@data, ExpiresAt=@expires
        WHEN NOT MATCHED THEN INSERT (Id,Data,ExpiresAt) VALUES (@id,@data,@expires);`))
      .then(() => callback()).catch(callback);
  }
  destroy(sid, callback = () => {}) {
    getPool().then(pool => pool.request().input('id', sql.VarChar(128), sid)
      .query('DELETE FROM Sessions WHERE Id=@id')).then(() => callback()).catch(callback);
  }
  touch(sid, value, callback = () => {}) { this.set(sid, value, callback); }
}
