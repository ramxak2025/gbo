package ru.iborcuha.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.compose.*
import dagger.hilt.android.AndroidEntryPoint
import ru.iborcuha.app.ui.*
import ru.iborcuha.app.ui.navigation.*
import ru.iborcuha.app.ui.screens.*
import ru.iborcuha.app.ui.theme.IBorcuhaTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            IBorcuhaTheme(darkTheme = true) {
                val viewModel: MainViewModel = hiltViewModel()
                val authState by viewModel.authState.collectAsState()
                val data by viewModel.data.collectAsState()

                when (val state = authState) {
                    is AuthState.Loading -> {
                        Box(Modifier.fillMaxSize()) {
                            CircularProgressIndicator(
                                modifier = Modifier.align(androidx.compose.ui.Alignment.Center),
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                    }
                    is AuthState.Unauthenticated -> {
                        LoginScreen(
                            onLogin = { phone, password -> viewModel.login(phone, password) },
                            isLoading = viewModel.isLoading.collectAsState().value,
                            error = viewModel.error.collectAsState().value,
                            onClearError = { viewModel.clearError() },
                        )
                    }
                    is AuthState.Authenticated -> {
                        MainApp(
                            role = state.role,
                            userId = state.userId,
                            user = state.user,
                            student = state.student,
                            data = data,
                            onLogout = { viewModel.logout() },
                            onRefresh = { viewModel.refreshData() },
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MainApp(
    role: String,
    userId: String,
    user: ru.iborcuha.app.data.models.User,
    student: ru.iborcuha.app.data.models.Student?,
    data: ru.iborcuha.app.data.models.DataBundle,
    onLogout: () -> Unit,
    onRefresh: () -> Unit,
) {
    val navController = rememberNavController()
    val tabs = when (role) {
        "trainer" -> trainerTabs()
        "student" -> studentTabs()
        else -> adminTabs()
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            FloatingBottomBar(navController = navController, tabs = tabs)
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(bottom = 0.dp),
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    navController = navController,
                    role = role,
                    userId = userId,
                    user = user,
                    student = student,
                    data = data,
                )
            }
            composable(Screen.Cash.route) {
                CashScreen(data = data, userId = userId)
            }
            composable(Screen.Team.route) {
                TeamScreen(
                    navController = navController,
                    role = role,
                    userId = userId,
                    data = data,
                )
            }
            composable(Screen.Tournaments.route) {
                TournamentsScreen(navController = navController, data = data)
            }
            composable(Screen.Materials.route) {
                MaterialsScreen(data = data)
            }
            composable(Screen.Profile.route) {
                ProfileScreen(
                    user = user,
                    student = student,
                    role = role,
                    data = data,
                    onLogout = onLogout,
                )
            }
        }
    }
}
