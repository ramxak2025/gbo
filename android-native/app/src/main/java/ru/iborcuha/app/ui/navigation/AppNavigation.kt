package ru.iborcuha.app.ui.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.*
import ru.iborcuha.app.ui.theme.*

sealed class Screen(val route: String, val label: String, val icon: ImageVector, val iconFilled: ImageVector) {
    data object Dashboard : Screen("dashboard", "Главная", Icons.Outlined.Home, Icons.Filled.Home)
    data object Cash : Screen("cash", "Касса", Icons.Outlined.AccountBalanceWallet, Icons.Filled.AccountBalanceWallet)
    data object Team : Screen("team", "Команда", Icons.Outlined.People, Icons.Filled.People)
    data object Tournaments : Screen("tournaments", "Турниры", Icons.Outlined.EmojiEvents, Icons.Filled.EmojiEvents)
    data object Materials : Screen("materials", "Видео", Icons.Outlined.VideoLibrary, Icons.Filled.VideoLibrary)
    data object Profile : Screen("profile", "Профиль", Icons.Outlined.Person, Icons.Filled.Person)
}

sealed class DetailScreen(val route: String) {
    data object StudentDetail : DetailScreen("student/{id}")
    data object TournamentDetail : DetailScreen("tournament/{id}")
    data object Attendance : DetailScreen("attendance/{groupId}")
    data object Groups : DetailScreen("groups")
    data object AddStudent : DetailScreen("add-student")
    data object Settings : DetailScreen("settings")
}

fun trainerTabs() = listOf(Screen.Dashboard, Screen.Cash, Screen.Team, Screen.Tournaments, Screen.Materials)
fun studentTabs() = listOf(Screen.Dashboard, Screen.Team, Screen.Tournaments, Screen.Materials, Screen.Profile)
fun adminTabs() = listOf(Screen.Dashboard, Screen.Team, Screen.Tournaments, Screen.Materials, Screen.Profile)

@Composable
fun FloatingBottomBar(
    navController: NavHostController,
    tabs: List<Screen>,
    modifier: Modifier = Modifier,
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(
            modifier = Modifier
                .shadow(16.dp, RoundedCornerShape(999.dp), ambientColor = Color.Black.copy(0.4f))
                .clip(RoundedCornerShape(999.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color.White.copy(alpha = 0.12f),
                            Color.White.copy(alpha = 0.05f),
                        )
                    )
                )
                .background(Color(0xFF15151F).copy(alpha = 0.85f))
                .padding(horizontal = 8.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            tabs.forEach { screen ->
                val selected = currentRoute == screen.route
                val icon = if (selected) screen.iconFilled else screen.icon

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .then(
                            if (selected) Modifier.background(
                                Brush.linearGradient(listOf(BrandGradientStart, BrandGradientEnd))
                            ) else Modifier
                        )
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            icon,
                            contentDescription = screen.label,
                            tint = if (selected) Color.White else Color.White.copy(0.5f),
                            modifier = Modifier.size(22.dp),
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            screen.label,
                            color = if (selected) Color.White else Color.White.copy(0.5f),
                            fontSize = 10.sp,
                            fontWeight = if (selected) androidx.compose.ui.text.font.FontWeight.Bold
                                else androidx.compose.ui.text.font.FontWeight.Medium,
                        )
                    }
                }
            }
        }
    }
}
