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

import ru.iborcuha.app.data.models.*
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*

@Composable
fun ProfileScreen(
    user: User,
    student: Student?,
    role: String,
    data: DataBundle,
    onLogout: () -> Unit,
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
                "Профиль",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                modifier = Modifier.padding(bottom = 20.dp),
            )

            val heroGradient = when (role) {
                "superadmin" -> listOf(AdminGradientStart, AdminGradientEnd)
                "trainer" -> listOf(TrainerGradientStart, TrainerGradientEnd)
                else -> listOf(StudentGradientStart, StudentGradientEnd)
            }

            LiquidGlassCard(Modifier.fillMaxWidth(), radius = 28.dp, padding = 0.dp) {
                Box(Modifier.fillMaxWidth().background(Brush.linearGradient(heroGradient), androidx.compose.foundation.shape.RoundedCornerShape(28.dp)).padding(24.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Box(Modifier.size(80.dp).clip(CircleShape).background(Color.White.copy(0.2f)), contentAlignment = Alignment.Center) {
                            Text(user.name.take(2).uppercase(), fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }
                        Spacer(Modifier.height(12.dp))
                        Text(user.name, fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
                        Spacer(Modifier.height(4.dp))
                        Surface(shape = androidx.compose.foundation.shape.RoundedCornerShape(999.dp), color = Color.White.copy(0.2f)) {
                            Text(
                                when (role) { "superadmin" -> "Админ"; "trainer" -> "Тренер"; else -> "Спортсмен" },
                                fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            if (user.phone.isNotEmpty()) {
                LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Phone, null, tint = Info, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text(user.phone, fontSize = 14.sp, color = Color.White)
                    }
                }
            }
            if (user.city != null) {
                LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 10.dp), radius = 20.dp, padding = 14.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.LocationOn, null, tint = Info, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text(user.city, fontSize = 14.sp, color = Color.White)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // Logout
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Danger.copy(0.15f)),
            ) {
                Icon(Icons.Filled.Logout, null, tint = Danger, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text("Выйти из аккаунта", color = Danger, fontWeight = FontWeight.Bold)
            }
        }
    }
}

