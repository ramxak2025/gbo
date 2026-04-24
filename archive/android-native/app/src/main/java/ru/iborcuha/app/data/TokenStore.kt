package ru.iborcuha.app.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "iborcuha_prefs")

class TokenStore(private val context: Context) {

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_KEY = stringPreferencesKey("auth_user")
        private val ROLE_KEY = stringPreferencesKey("auth_role")
        private val USER_ID_KEY = stringPreferencesKey("auth_user_id")
        private val STUDENT_ID_KEY = stringPreferencesKey("auth_student_id")
    }

    suspend fun getToken(): String? =
        context.dataStore.data.map { it[TOKEN_KEY] }.first()

    suspend fun saveToken(token: String) {
        context.dataStore.edit { it[TOKEN_KEY] = token }
    }

    suspend fun clearToken() {
        context.dataStore.edit {
            it.remove(TOKEN_KEY)
            it.remove(USER_KEY)
            it.remove(ROLE_KEY)
            it.remove(USER_ID_KEY)
            it.remove(STUDENT_ID_KEY)
        }
    }

    suspend fun saveAuthInfo(userId: String, role: String, studentId: String? = null) {
        context.dataStore.edit {
            it[USER_ID_KEY] = userId
            it[ROLE_KEY] = role
            if (studentId != null) it[STUDENT_ID_KEY] = studentId
        }
    }

    suspend fun getUserId(): String? =
        context.dataStore.data.map { it[USER_ID_KEY] }.first()

    suspend fun getRole(): String? =
        context.dataStore.data.map { it[ROLE_KEY] }.first()

    suspend fun getStudentId(): String? =
        context.dataStore.data.map { it[STUDENT_ID_KEY] }.first()
}
