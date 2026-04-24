package ru.iborcuha.app.data

import ru.iborcuha.app.data.api.ApiService
import ru.iborcuha.app.data.models.*

class Repository(
    private val api: ApiService,
    private val tokenStore: TokenStore,
) {
    suspend fun login(phone: String, password: String): LoginResponse {
        val response = api.login(LoginRequest(phone, password))
        tokenStore.saveToken(response.token)
        tokenStore.saveAuthInfo(response.userId, response.role, response.studentId)
        return response
    }

    suspend fun logout() {
        try { api.logout() } catch (_: Exception) {}
        tokenStore.clearToken()
    }

    suspend fun getData(): DataBundle = api.getData()

    suspend fun createStudent(data: Map<String, Any?>) = api.createStudent(data)
    suspend fun updateStudent(id: String, data: Map<String, Any?>) = api.updateStudent(id, data)
    suspend fun deleteStudent(id: String) = api.deleteStudent(id)

    suspend fun createGroup(data: Map<String, Any?>) = api.createGroup(data)
    suspend fun updateGroup(id: String, data: Map<String, Any?>) = api.updateGroup(id, data)
    suspend fun deleteGroup(id: String) = api.deleteGroup(id)

    suspend fun createTransaction(data: Map<String, Any?>) = api.createTransaction(data)
    suspend fun deleteTransaction(id: String) = api.deleteTransaction(id)

    suspend fun bulkAttendance(data: Map<String, Any?>) = api.bulkAttendance(data)

    suspend fun registerTournament(tournamentId: String, studentId: String) =
        api.registerTournament(mapOf("tournamentId" to tournamentId, "studentId" to studentId))

    suspend fun unregisterTournament(tournamentId: String, studentId: String) =
        api.unregisterTournament(mapOf("tournamentId" to tournamentId, "studentId" to studentId))

    suspend fun createNews(data: Map<String, Any?>) = api.createNews(data)
    suspend fun deleteNews(id: String) = api.deleteNews(id)

    suspend fun isLoggedIn(): Boolean = tokenStore.getToken() != null
    suspend fun getUserId(): String? = tokenStore.getUserId()
    suspend fun getRole(): String? = tokenStore.getRole()
    suspend fun getStudentId(): String? = tokenStore.getStudentId()
}
