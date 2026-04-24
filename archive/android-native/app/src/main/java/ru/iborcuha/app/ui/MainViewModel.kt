package ru.iborcuha.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import ru.iborcuha.app.data.Repository
import ru.iborcuha.app.data.models.*
import javax.inject.Inject

sealed class AuthState {
    data object Loading : AuthState()
    data object Unauthenticated : AuthState()
    data class Authenticated(
        val userId: String,
        val role: String,
        val user: User,
        val student: Student? = null,
        val studentId: String? = null,
    ) : AuthState()
}

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: Repository,
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState

    private val _data = MutableStateFlow(DataBundle())
    val data: StateFlow<DataBundle> = _data

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init {
        checkAuth()
    }

    private fun checkAuth() {
        viewModelScope.launch {
            try {
                if (repository.isLoggedIn()) {
                    val userId = repository.getUserId()
                    val role = repository.getRole()
                    if (userId != null && role != null) {
                        val bundle = repository.getData()
                        _data.value = bundle
                        val user = bundle.users.find { it.id == userId }
                        val studentId = repository.getStudentId()
                        val student = if (studentId != null) bundle.students.find { it.id == studentId } else null
                        if (user != null) {
                            _authState.value = AuthState.Authenticated(userId, role, user, student, studentId)
                        } else {
                            _authState.value = AuthState.Unauthenticated
                        }
                    } else {
                        _authState.value = AuthState.Unauthenticated
                    }
                } else {
                    _authState.value = AuthState.Unauthenticated
                }
            } catch (e: Exception) {
                _authState.value = AuthState.Unauthenticated
            }
        }
    }

    fun login(phone: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = repository.login(phone, password)
                val bundle = repository.getData()
                _data.value = bundle
                _authState.value = AuthState.Authenticated(
                    userId = response.userId,
                    role = response.role,
                    user = response.user,
                    student = response.student,
                    studentId = response.studentId,
                )
            } catch (e: Exception) {
                _error.value = e.message ?: "Ошибка входа"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout()
            _authState.value = AuthState.Unauthenticated
            _data.value = DataBundle()
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            try {
                _data.value = repository.getData()
            } catch (_: Exception) {}
        }
    }

    fun clearError() { _error.value = null }
}
