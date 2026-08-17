// Phoenix Awaken OS visual identity: calm, high-contrast Ember login surface.
import QtQuick 2.15
import QtQuick.Controls 2.15
import SddmComponents 2.0

Rectangle {
    id: root
    width: 1920
    height: 1080
    color: "#15181b"

    Image {
        anchors.fill: parent
        source: "/usr/share/phoenix-awaken/themes/assets/phoenix-ember-wallpaper.svg"
        fillMode: Image.PreserveAspectCrop
        opacity: 0.58
    }

    Rectangle {
        anchors.centerIn: parent
        width: Math.min(parent.width * 0.82, 560)
        height: 410
        radius: 18
        color: "#23282c"
        border.color: "#d8792b"
        border.width: 1
        opacity: 0.96

        Column {
            anchors.fill: parent
            anchors.margins: 42
            spacing: 18

            Label {
                text: "PHOENIX AWAKEN OS"
                color: "#f1b85a"
                font.pixelSize: 18
                font.letterSpacing: 3
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            Label {
                text: "Evidence-first security desktop"
                color: "#e8edef"
                font.pixelSize: 24
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }

            ComboBox {
                id: userBox
                model: userModel
                currentIndex: userModel.lastUserIndex
                width: parent.width
                accessibleName: "User account"
            }

            TextField {
                id: passwordBox
                width: parent.width
                echoMode: TextInput.Password
                placeholderText: "Password"
                accessibleName: "Password"
                onAccepted: loginButton.clicked()
            }

            Row {
                width: parent.width
                spacing: 12

                ComboBox {
                    id: sessionBox
                    model: sessionModel
                    width: parent.width - loginButton.width - 12
                    currentIndex: sessionModel.lastIndex
                    accessibleName: "Desktop session"
                }

                Button {
                    id: loginButton
                    text: "Sign in"
                    width: 126
                    onClicked: sddm.login(userBox.currentText, passwordBox.text, sessionBox.currentIndex)
                }
            }

            Label {
                text: "Local-first. Review before you trust."
                color: "#9ba6ac"
                font.pixelSize: 13
                horizontalAlignment: Text.AlignHCenter
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }

    Connections {
        target: sddm
        function onLoginFailed() { passwordBox.text = "" }
    }
}
