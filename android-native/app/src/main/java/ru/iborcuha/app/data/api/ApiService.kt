package ru.iborcuha.app.data.api

import retrofit2.http.*
import ru.iborcuha.app.data.models.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("auth/logout")
    suspend fun logout()

    @GET("auth/me")
    suspend fun me(): LoginResponse?

    @POST("auth/refresh")
    suspend fun refresh(): Map<String, String>

    @GET("data")
    suspend fun getData(): DataBundle

    @POST("data/students")
    suspend fun createStudent(@Body body: Map<String, Any?>): Student

    @PUT("data/students/{id}")
    suspend fun updateStudent(@Path("id") id: String, @Body body: Map<String, Any?>): Student

    @DELETE("data/students/{id}")
    suspend fun deleteStudent(@Path("id") id: String)

    @POST("data/groups")
    suspend fun createGroup(@Body body: Map<String, Any?>): Group

    @PUT("data/groups/{id}")
    suspend fun updateGroup(@Path("id") id: String, @Body body: Map<String, Any?>): Group

    @DELETE("data/groups/{id}")
    suspend fun deleteGroup(@Path("id") id: String)

    @POST("data/transactions")
    suspend fun createTransaction(@Body body: Map<String, Any?>): Transaction

    @DELETE("data/transactions/{id}")
    suspend fun deleteTransaction(@Path("id") id: String)

    @POST("data/attendance/bulk")
    suspend fun bulkAttendance(@Body body: Map<String, Any?>)

    @POST("data/tournaments")
    suspend fun createTournament(@Body body: Map<String, Any?>): Tournament

    @DELETE("data/tournaments/{id}")
    suspend fun deleteTournament(@Path("id") id: String)

    @POST("data/tournament-registrations")
    suspend fun registerTournament(@Body body: Map<String, String>)

    @HTTP(method = "DELETE", path = "data/tournament-registrations", hasBody = true)
    suspend fun unregisterTournament(@Body body: Map<String, String>)

    @POST("data/news")
    suspend fun createNews(@Body body: Map<String, Any?>)

    @DELETE("data/news/{id}")
    suspend fun deleteNews(@Path("id") id: String)

    @POST("data/materials")
    suspend fun createMaterial(@Body body: Map<String, Any?>): Material

    @DELETE("data/materials/{id}")
    suspend fun deleteMaterial(@Path("id") id: String)

    @POST("push/register-token")
    suspend fun registerPushToken(@Body body: Map<String, String>)
}
