package ru.iborcuha.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import ru.iborcuha.app.data.models.*
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*

@Composable
fun TeamScreen(
    navController: NavController,
    role: String,
    userId: String,
    data: DataBundle,
) {
    Box(Modifier.fillMaxSize().background(BgDark)) {
        Box(Modifier.offset((-60).dp, (-40).dp).size(280.dp).clip(CircleShape).background(Purple.copy(0.15f)))

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 60.dp, bottom = 140.dp)
        ) {
            Text(
                "Команда",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                modifier = Modifier.padding(bottom = 20.dp),
            )

            val myStudents = if (role == "superadmin") data.students else data.students.filter { it.trainerId == userId }
            myStudents.forEach { s ->
                LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(44.dp).clip(CircleShape).background(Accent.copy(0.8f)), contentAlignment = Alignment.Center) {
                            Text(s.name.take(2).uppercase(), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(s.name, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(s.belt ?: "Без пояса", fontSize = 12.sp, color = TextTertiary)
                        }
                        Box(Modifier.size(10.dp).clip(CircleShape).background(if (isExpiredCheck(s.subscriptionExpiresAt)) Danger else Success))
                    }
                }
            }
            if (myStudents.isEmpty()) {
                LiquidGlassCard(Modifier.fillMaxWidth(), radius = 20.dp, padding = 32.dp) {
                    Text("Нет учеников", fontSize = 16.sp, color = TextTertiary, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }
        }
    }
}

private fun isExpiredCheck(dateStr: String?): Boolean {
    if (dateStr.isNullOrBlank()) return true
    return try {
        java.time.LocalDate.parse(dateStr.take(10)).isBefore(java.time.LocalDate.now())
    } catch (_: Exception) { true }
}
