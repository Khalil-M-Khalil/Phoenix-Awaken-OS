# تطبيقات سطح المكتب في Phoenix Awaken OS

## الفكرة

Phoenix Awaken OS ليس مختبر أمن فقط؛ يجب أن يكون نظام Linux يومياً يمكن للمستخدم فيه إدارة ملفاته وصوره ووسائطه وأقراصه قبل أن يفتح أدوات Phoenix الأمنية. لذلك أضيفت طبقة تطبيقات عملية فوق KDE Plasma، مع إبقاء الأدوات التي تغيّر الأقراص أو تتطلب صلاحيات عالية واضحة للمستخدم.

## التطبيقات الأساسية

| المجال | التطبيقات | الاستخدام |
|---|---|---|
| إدارة الملفات | Dolphin | تصفح الملفات، الأقراص، النسخ، النقل، وإدارة المسارات |
| إدارة الأقراص | GParted وKDE Partition Manager | إنشاء الأقسام وتغيير حجمها وفحصها؛ يتطلبان حذراً وصلاحيات عالية |
| الصور | Gwenview | عرض الصور وإدارتها بسرعة |
| تحرير الصور | GIMP وKrita | تحرير الصور والرسومات والطبقات والرسم الرقمي |
| الفيديو | Haruna | تشغيل الفيديو محلياً عبر Qt/QML وlibmpv |
| تحرير الفيديو | Kdenlive | تحرير فيديو متعدد المسارات |
| المستندات | Okular وLibreOffice | قراءة PDF والعمل على المستندات والجداول والعروض |
| الأرشفة | Ark وp7zip وzip/unzip | فتح وإنشاء ملفات ZIP وTAR وصيغ أرشفة أخرى |
| النصوص والطرفية | Kate وKonsole | تحرير النصوص وإدارة النظام من الطرفية |
| لقطات الشاشة | Spectacle | التقاط الشاشة وتوثيق خطوات العمل |
| النسخ الاحتياطي | KBackup | إنشاء نسخ احتياطية محلية يحددها المستخدم |
| تحليل المساحة | Filelight | معرفة أين تستهلك الملفات مساحة القرص |
| صحة الأقراص والنسخ المحلي | smartmontools وrsync | قراءة حالة الأقراص ومزامنة نسخ محلية دون سحابة |
| الصوت | Elisa وPulseAudio Volume Control | تشغيل الموسيقى وضبط أجهزة الصوت والمزج |
| الاتصال بالأجهزة | KDE Connect | ربط أجهزة يملكها المستخدم عبر الشبكة المحلية |
| المسح الضوئي | Skanlite | استخدام الماسح الضوئي محلياً |

## ملاحظة مهمة حول GParted

GParted ليس أداة عادية مثل عارض الصور. يمكنه إنشاء الأقسام أو حذفها أو تغيير حجمها، ولذلك فإن الخطأ في اختيار القرص قد يؤدي إلى فقدان بيانات. سيأتي مثبتاً لتوفير قدرة النظام، لكن يجب تشغيله بوضوح من قائمة النظام وبصلاحيات مؤقتة، مع رسالة تحذير قبل أي عملية كتابة.

## ما لم يُدرج افتراضياً

لم أضف VLC لأن Fedora الأساسية لا تضمن دائماً المستودعات أو الترميزات التي يحتاجها بالشكل نفسه، واخترت Haruna كمشغل Qt أصلي متوفر في Fedora. يمكن إضافة VLC لاحقاً عبر مستودع موثوق أو Flatpak بعد اختبار الترخيص والترميزات، لكن لا ينبغي أن يصبح ذلك شرطاً لبناء النظام.

كما لم أضع OBS Studio أو Blender أو Krita إضافية ثقيلة في المسار الأساسي إلا عند الحاجة؛ GIMP وKrita وKdenlive موجودة في الطبقة الحالية، أما الأدوات الكبيرة جداً فيمكن جعلها ملفاً اختيارياً حتى لا يصبح ISO ضخماً وبطيئاً على أجهزة ضعيفة.

## سياسة الاستخدام

التطبيقات اليومية تعمل محلياً ولا تتطلب حساباً أو خدمة سحابية. تطبيق KDE Connect يبقى اختيارياً من ناحية الاتصال، ولا يُفعّل مشاركة الملفات تلقائياً. النسخ الاحتياطي لا يرفع الملفات إلى الإنترنت. تطبيقات Phoenix الأمنية تسجل provenance وتقاريرها داخل Evidence Capsule بدلاً من تخزين نتائج غامضة.

## References

[1]: https://packages.fedoraproject.org/pkgs/gparted/ "Fedora Packages — GParted"
[2]: https://packages.fedoraproject.org/pkgs/kde-partitionmanager/kde-partitionmanager/ "Fedora Packages — KDE Partition Manager"
[3]: https://packages.fedoraproject.org/pkgs/gimp/gimp/ "Fedora Packages — GIMP"
[4]: https://packages.fedoraproject.org/pkgs/gwenview/gwenview/ "Fedora Packages — Gwenview"
[5]: https://packages.fedoraproject.org/pkgs/haruna/haruna/ "Fedora Packages — Haruna"
[6]: https://packages.fedoraproject.org/pkgs/kdenlive/kdenlive/ "Fedora Packages — Kdenlive"
[7]: https://apps.kde.org/ "KDE Applications"
[8]: https://fedoraproject.org/kde/ "Fedora KDE and Atomic Desktops"
