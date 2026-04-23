package ru.iborcuha.app.data.api

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import ru.iborcuha.app.data.TokenStore

class AuthInterceptor(private val tokenStore: TokenStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenStore.getToken() }
        val request = if (token != null) {
            chain.request().newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            chain.request()
        }

        val response = chain.proceed(request)

        if (response.code == 401 && token != null) {
            response.close()
            val newToken = runBlocking {
                try {
                    val refreshResponse = chain.proceed(
                        chain.request().newBuilder()
                            .url("https://iborcuha.ru/api/auth/refresh")
                            .post(okhttp3.RequestBody.create(null, ""))
                            .addHeader("Authorization", "Bearer $token")
                            .build()
                    )
                    if (refreshResponse.isSuccessful) {
                        val body = refreshResponse.body?.string()
                        val newT = com.google.gson.Gson().fromJson(body, Map::class.java)["token"] as? String
                        if (newT != null) tokenStore.saveToken(newT)
                        newT
                    } else null
                } catch (e: Exception) {
                    null
                }
            }

            return if (newToken != null) {
                chain.proceed(
                    request.newBuilder()
                        .removeHeader("Authorization")
                        .addHeader("Authorization", "Bearer $newToken")
                        .build()
                )
            } else {
                runBlocking { tokenStore.clearToken() }
                chain.proceed(request)
            }
        }

        return response
    }
}
