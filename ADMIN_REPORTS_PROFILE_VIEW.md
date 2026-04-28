# 👁️ Admin Reports - Profile View Feature

## 📋 Overview
Admin panelida reporter va reported user profillarini ko'rish funksiyasi qo'shildi. Endi admin har qanday foydalanuvchining ismiga yoki emailiga bosib, to'liq profilini ko'rishi mumkin.

## ✨ Features Added

### 1. **Clickable User Names & Emails**
- Reporter va Reported User ismlariga bosish mumkin
- Email addresslariga ham bosish mumkin
- Hover effekt: background color o'zgaradi
- 👁️ icon ko'rsatiladi (bosilishi mumkinligini bildiradi)

### 2. **Profile Modal**
- MemberSheet komponenti ishlatiladi
- To'liq foydalanuvchi ma'lumotlari ko'rsatiladi:
  - Avatar
  - System info (registration date, DOB, gender, location)
  - Subscription status
  - Credits
  - Profile fields (name, email, about, gives, wants)
  - Activity stats (meetings, posts, referrals)
  - Messengers (WeChat, WhatsApp)
- Admin profilni tahrirlashi mumkin
- Admin foydalanuvchini ban/unban qilishi mumkin

### 3. **Enhanced Block Functionality**
- Block qilganda quyidagi ma'lumotlar saqlanadi:
  - `ban_reason`: Report turi (Spam, Harassment, etc.)
  - `banned_at`: Ban qilingan vaqt
  - `banned`: true/false flag
- Admin notes yanada batafsil:
  ```
  ✅ User banned by admin
  📋 Report Type: Harassment
  👤 Reported by: John Doe
  ⏰ Action taken: 27 Apr 2026, 22:46
  ```

## 🗂️ Files Modified

### 1. **src/admin/screens/AdminReports.jsx**
```javascript
// Added imports
import MemberSheet from '../components/members/MemberSheet'

// Added state
const [selectedMember, setSelectedMember] = useState(null)

// Added handler
const handleViewProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    
    if (data) {
        setSelectedMember(data)
    }
}

// Updated ReportCard
<ReportCard
    report={report}
    onUpdateStatus={handleUpdateStatus}
    onBlockUser={handleBlockUser}
    onViewProfile={handleViewProfile}  // NEW
    lang={lang}
/>

// Added modal
{selectedMember && (
    <MemberSheet
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        lang={lang}
    />
)}
```

### 2. **src/admin/components/members/MemberSheet.jsx**
```javascript
// Updated to accept both memberId and member prop
export default function MemberSheet({ memberId, member: memberProp, onClose, lang }) {
    // If member prop provided, use it directly
    // Otherwise fetch by memberId
    
    useEffect(() => {
        if (memberProp) {
            setMember(memberProp)
            setForm({...})
            setLoading(false)
            return
        }
        
        if (memberId) {
            getMemberById(memberId).then(m => {...})
        }
    }, [memberId, memberProp])
}
```

### 3. **ReportCard Component**
```javascript
// Reporter section - clickable
<button
    onClick={() => report.reporter_id && onViewProfile(report.reporter_id)}
    className="text-left w-full hover:bg-gray-100 active:bg-gray-200 rounded-lg p-1.5 -m-1.5 transition-colors"
>
    <div className="text-[13px] font-semibold text-gray-900 flex items-center gap-1">
        {report.reporter_name || 'Unknown'}
        {report.reporter_id && <span className="text-[10px]">👁️</span>}
    </div>
    <div className="text-[11px] text-gray-500 truncate">
        {report.reporter_email || 'No email'}
    </div>
</button>

// Reported User section - clickable (same structure)
```

### 4. **Database Migration**
```sql
-- supabase/migrations/ADD_BAN_FIELDS.sql

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_banned_at ON profiles(banned_at DESC) WHERE banned_at IS NOT NULL;
```

### 5. **Block User Mutation**
```javascript
const blockUserMutation = useMutation({
    mutationFn: async ({ reportedId, reportId, reason, reporterName }) => {
        // Block user with detailed info
        await supabase
            .from('profiles')
            .update({ 
                banned: true, 
                ban_reason: reason,
                banned_at: new Date().toISOString(),
                updated_at: new Date().toISOString() 
            })
            .eq('id', reportedId)

        // Update report with detailed admin notes
        await supabase
            .from('reports')
            .update({
                status: 'resolved',
                admin_notes: `✅ User banned by admin\n📋 Report Type: ${reason}\n👤 Reported by: ${reporterName}\n⏰ Action taken: ${timestamp}`,
                updated_at: new Date().toISOString()
            })
            .eq('id', reportId)
    }
})
```

## 🎨 UI/UX Improvements

### Visual Feedback
- **Hover Effect**: Background color o'zgaradi (gray-100)
- **Active State**: Bosilganda background color yanada to'q (gray-200)
- **Icon Indicator**: 👁️ emoji ko'rsatiladi
- **Cursor**: Pointer cursor bosilishi mumkin bo'lgan elementlarda

### Responsive Design
- Mobile-friendly
- Touch-friendly button sizes
- Smooth transitions

## 🔒 Security Considerations

1. **Authentication Check**: Faqat authenticated adminlar ko'rishi mumkin
2. **RLS Policies**: Database level security
3. **Error Handling**: Xatoliklar to'g'ri handle qilinadi
4. **Toast Notifications**: User feedback

## 📊 Data Flow

```
User clicks name/email
    ↓
handleViewProfile(userId)
    ↓
Fetch profile from Supabase
    ↓
setSelectedMember(data)
    ↓
MemberSheet modal opens
    ↓
Display full profile
    ↓
Admin can edit/ban
    ↓
Save changes to database
    ↓
Refresh queries
    ↓
Modal closes
```

## 🧪 Testing Checklist

- [ ] Click reporter name - modal opens
- [ ] Click reporter email - modal opens
- [ ] Click reported user name - modal opens
- [ ] Click reported user email - modal opens
- [ ] Modal displays correct data
- [ ] Edit profile works
- [ ] Ban user works
- [ ] Unban user works
- [ ] Modal closes properly
- [ ] Queries refresh after changes
- [ ] Error handling works
- [ ] Toast notifications appear
- [ ] Mobile responsive
- [ ] Touch interactions work

## 🚀 Future Enhancements

1. **Quick Actions**: Modal ichida quick ban/unban button
2. **History View**: User ban history
3. **Bulk Actions**: Multiple users ban qilish
4. **Export**: User data export
5. **Notes**: Admin notes qo'shish
6. **Tags**: User tags qo'shish

## 📝 Notes

- MemberSheet komponenti reusable - boshqa joylarda ham ishlatish mumkin
- Profile view read-only yoki editable bo'lishi mumkin
- Ban reason va timestamp tracking qo'shildi
- Admin notes yanada informative

## ✅ Completed

- ✅ Clickable user names
- ✅ Clickable emails
- ✅ Profile modal integration
- ✅ Ban reason tracking
- ✅ Ban timestamp tracking
- ✅ Enhanced admin notes
- ✅ Database migration
- ✅ Error handling
- ✅ Toast notifications
- ✅ UI/UX improvements

---

**Last Updated**: 27 Apr 2026, 22:50
**Status**: ✅ Complete and Ready for Testing
