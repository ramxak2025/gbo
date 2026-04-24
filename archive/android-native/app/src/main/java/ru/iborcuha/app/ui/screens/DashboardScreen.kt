package ru.iborcuha.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import ru.iborcuha.app.data.models.*
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun DashboardScreen(
    navController: NavController,
    role: String,
    userId: String,
    user: User,
    student: Student?,
    data: DataBundle,
) {
    val isTrainer = role == "trainer"
    val isStudent = role == "student"
    val myStudents = if (role == "superadmin") data.students else data.students.filter { it.trainerId == userId }
    val myGroups = if (role == "superadmin") data.groups else data.groups.filter { it.trainerId == userId }
    val myTx = if (role == "superadmin") data.transactions else data.transactions.filter { it.trainerId == userId }
    val activeStudents = myStudents.filter { !isExpired(it.subscriptionExpiresAt) }
    val debtors = myStudents.filter { isExpired(it.subscriptionExpiresAt) }
    val income = myTx.filter { it.type == "income" }.sumOf { it.amount }
    val expense = myTx.filter { it.type == "expense" }.sumOf { it.amount }
    val balance = income - expense

    val heroGradient = when (role) {
        "superadmin" -> listOf(AdminGradientStart, AdminGradientEnd)
        "trainer" -> listOf(TrainerGradientStart, TrainerGradientEnd)
        else -> listOf(StudentGradientStart, StudentGradientEnd)
    }

    Box(Modifier.fillMaxSize().background(BgDark)) {
        // Ambient blobs
        Box(Modifier.offset((-80).dp, (-50).dp).size(300.dp).clip(CircleShape).background(heroGradient[0].copy(0.2f)))
        Box(Modifier.offset(250.dp, 300.dp).size(250.dp).clip(CircleShape).background(heroGradient[1].copy(0.15f)))

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 60.dp, bottom = 140.dp)
        ) {
            // Hero
            LiquidGlassCard(Modifier.fillMaxWidth(), radius = 28.dp, padding = 0.dp, onClick = { navController.navigate("profile") }) {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(Brush.linearGradient(heroGradient), RoundedCornerShape(28.dp))
                        .padding(20.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier
                                .size(70.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(0.2f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            if (user.avatar != null) {
                                AsyncImage(user.avatar, "avatar", Modifier.size(64.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                            } else {
                                Text(user.name.take(2).uppercase(), fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                            }
                        }
                        Spacer(Modifier.width(16.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                if (isStudent) student?.name ?: user.name else user.clubName ?: user.name,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                maxLines = 1,
                            )
                            Text(
                                if (isStudent) data.groups.find { it.id == student?.groupId }?.name ?: "" else user.name,
                                fontSize = 14.sp,
                                color = Color.White.copy(0.85f),
                            )
                            if (user.sportType != null) {
                                Spacer(Modifier.height(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(999.dp),
                                    color = Color.White.copy(0.2f),
                                ) {
                                    Text(
                                        getSportLabel(user.sportType),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                    )
                                }
                            }
                        }
                        Icon(Icons.Filled.ChevronRight, null, tint = Color.White.copy(0.7f), modifier = Modifier.size(24.dp))
                    }
                }
            }

            Spacer(Modifier.height(14.dp))

            // Stats (trainer/admin)
            if (!isStudent) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatCard(Modifier.weight(1f), Icons.Outlined.People, "${myStudents.size}", "Ученики", Info)
                    StatCard(Modifier.weight(1f), Icons.Outlined.TrendingUp, "${activeStudents.size}", "Активные", Success)
                    StatCard(Modifier.weight(1f), Icons.Outlined.ErrorOutline, "${debtors.size}", "Долги", Danger)
                }
                Spacer(Modifier.height(14.dp))
            }

            // Balance (trainer)
            if (isTrainer) {
                LiquidGlassCard(Modifier.fillMaxWidth(), radius = 28.dp, padding = 20.dp, onClick = { navController.navigate("cash") }) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(44.dp).clip(CircleShape)
                                .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(Icons.Filled.AccountBalanceWallet, null, tint = Color.White, modifier = Modifier.size(22.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("ОБЩИЙ БАЛАНС", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextTertiary, letterSpacing = 1.sp)
                            Text(
                                "${if (balance >= 0) "+" else ""}${"%,d".format(balance)} ₽",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black,
                                color = if (balance >= 0) Success else Danger,
                                letterSpacing = (-0.5).sp,
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(Modifier.fillMaxWidth()) {
                        Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.TrendingUp, null, tint = Success, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("+${"%,d".format(income)}", color = Success, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Filled.TrendingDown, null, tint = Danger, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("−${"%,d".format(expense)}", color = Danger, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
                Spacer(Modifier.height(20.dp))
            }

            // Groups
            if (isTrainer && myGroups.isNotEmpty()) {
                Text("Группы", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(start = 4.dp, bottom = 12.dp))
                myGroups.forEach { group ->
                    val count = myStudents.count { it.groupId == group.id }
                    LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 16.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(40.dp).clip(CircleShape)
                                    .background(Brush.linearGradient(listOf(Color(0xFF8B5CF6), Color(0xFF6366F1)))),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Filled.FitnessCenter, null, tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(group.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Text(group.schedule.ifEmpty { "Нет расписания" }, fontSize = 12.sp, color = TextTertiary)
                            }
                            Surface(shape = RoundedCornerShape(999.dp), color = Color.White.copy(0.08f)) {
                                Text("$count чел.", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextSecondary, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                            }
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
            }

            // News
            if (data.news.isNotEmpty()) {
                Text("Новости", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(start = 4.dp, bottom = 12.dp))
                data.news.take(3).forEach { news ->
                    LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                        Row {
                            Box(
                                Modifier.size(36.dp).clip(CircleShape)
                                    .background(Brush.linearGradient(listOf(FireGradientMid, Accent))),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Filled.Newspaper, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            }
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(news.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1)
                                if (news.content.isNotEmpty()) {
                                    Text(news.content, fontSize = 13.sp, color = TextSecondary, maxLines = 2)
                                }
                            }
                        }
                    }
                }
            }

            // Tournaments
            if (data.tournaments.isNotEmpty()) {
                Spacer(Modifier.height(10.dp))
                Text("Турниры", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(start = 4.dp, bottom = 12.dp))
                data.tournaments.take(3).forEach { t ->
                    LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                Modifier.size(44.dp).clip(CircleShape)
                                    .background(Brush.linearGradient(listOf(FireGradientStart, FireGradientEnd))),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(Icons.Filled.EmojiEvents, null, tint = Color.White, modifier = Modifier.size(22.dp))
                            }
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(t.title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White, maxLines = 1)
                                Row {
                                    Icon(Icons.Outlined.CalendarToday, null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                                    Spacer(Modifier.width(4.dp))
                                    Text(formatDateShort(t.date), fontSize = 12.sp, color = TextTertiary)
                                    if (t.location.isNotEmpty()) {
                                        Spacer(Modifier.width(8.dp))
                                        Icon(Icons.Outlined.LocationOn, null, tint = TextTertiary, modifier = Modifier.size(12.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text(t.location, fontSize = 12.sp, color = TextTertiary, maxLines = 1)
                                    }
                                }
                            }
                            Icon(Icons.Filled.ChevronRight, null, tint = TextQuaternary, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(modifier: Modifier, icon: ImageVector, value: String, label: String, color: Color) {
    LiquidGlassCard(modifier, radius = 20.dp, padding = 14.dp) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Icon(icon, null, tint = color, modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(8.dp))
            Text(value, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextTertiary)
        }
    }
}

private fun isExpired(dateStr: String?): Boolean {
    if (dateStr.isNullOrBlank()) return true
    return try {
        LocalDate.parse(dateStr.take(10)).isBefore(LocalDate.now())
    } catch (_: Exception) { true }
}

private fun formatDateShort(iso: String): String {
    return try {
        LocalDate.parse(iso.take(10)).format(DateTimeFormatter.ofPattern("d MMM"))
    } catch (_: Exception) { iso }
}

fun getSportLabel(sport: String?): String = when (sport) {
    "bjj" -> "🥋 БЖЖ"
    "mma" -> "🥊 ММА"
    "boxing" -> "🥊 Бокс"
    "wrestling" -> "🤼 Вольная"
    "judo" -> "🥋 Дзюдо"
    "karate" -> "🥋 Карате"
    "kickboxing" -> "🥊 Кикбоксинг"
    "muaythai" -> "🥊 Муай-тай"
    "grappling" -> "🤼 Грэпплинг"
    else -> sport ?: "—"
}
