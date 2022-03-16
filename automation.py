"""The Automation Module allows operators to execute commands automatically at the next pass.
"""
from groundstation.backend_api.communications import CommunicationList, Communication
from groundstation.backend_api.housekeeping import HousekeepingLogList
from groundstation.backend_api.passover import PassoverList
from groundstation.backend_api.utils import add_passover
from groundstation.backend_api.user import UserList
from datetime import datetime, timezone
from pyorbital.orbital import Orbital
import os
import slack
import json
import subprocess
import time


def automate_communication():
    """Reads from a pre-defined script file called 'automation.txt' which contains messages
    separated by newlines. The Automation module will open this file and send each message to the comm module,
    which will then interpret and pass the message along to the satellite. The 'automation.txt' essentially mimicks a human
    user entering commands through the 'live commands' portal.
    """
    sender = CommunicationList()

    with open('automation.txt', 'r') as f:
        for line in f:
            line = line.strip("\n")

            message = {
                'message': line,
                'sender': 'automation',
                'receiver': 'comm',
                'is_queued': True
            }

            message = json.dumps(message)
            sender.post(local_data=message)

    timestamp = str(datetime.utcnow())
    message = 'An Ex-Alta 2 passover is beginning now! The timestamp for this passover is {0}'.format(timestamp)
    send_slack_notifs(message)


def automate_passovers():
    """Before Automation terminates, this function is run to set a 'wake up' timer for the next passover, so that it will
    be automatically run again during the next pass.
    """
    passover = PassoverList()
    housekeeping = HousekeepingLogList()

    # the automation will also handle queuing passover times
    passovers = passover.get(local_args={'limit': 1, 'next': 'true'})

    if passovers[1] == 200:
        passover_data = passovers[0]['data']['next_passovers']
        for ps in passover_data:
            time_obj = datetime.strptime(
                ps['timestamp'], '%Y-%m-%d %H:%M:%S.%f')
            time_obj = time_obj.replace(
                tzinfo=timezone.utc).astimezone(tz=None)
            f_time_min = time_obj.strftime('%H:%M')
            f_time_date = time_obj.strftime('%m/%d/%Y')

            subprocess.run(
                ['at', f_time_min, f_time_date, '-f', 'automate.sh'])
            print("Scheduled to automate at the next passover.")
    else:
        print("AUTOMATION: no more passovers found.")
        # calculate new passovers for the next 24 hours using current TLE data

        hk = housekeeping.get(local_args={'limit': 1, 'newest-first': 'true'})

        tle = hk[0]['data']['logs'][0]['tle']
        lines = tle.split('\n')
    
        orb = Orbital('ex-alta 2', line1=lines[0], line2=lines[1])
        dtobj = datetime.utcnow()
        passes = orb.get_next_passes(dtobj, 24, -113.4938, 53.5461, 0.645) # edmonton coordinates and elevation
        ps_data = {'passovers': [{'timestamp': str(ps[0])} for ps in passes]}

        passover.post(local_data=json.dumps(ps_data))
        

def send_slack_notifs(message):
    """Sends out a Slack message to all subscribed users.
    """
    # api call to get all users
    user_list = UserList()

    users = user_list.get(local_args={'limit': 1000})[0]['data']

    token = os.getenv('SLACK_TOKEN')
    if token is not None:
        client = slack.WebClient(token='xoxb-58810056594-3097149250131-xK3JH7caXxC5oQ9aQ0etzAsM')
        for user in users:
            if user.subscribed_to_slack and user.slack_id is not None:
                try:
                    client.chat_postMessage(channel=user.slack_id, text=message)
                except:
                    print('Error: slack id "{0}" is invalid.'.format(user.slack_id))
    else:
        print('Error: SLACK_TOKEN environemnt variable not set!')



def main():
    """Main function called when automation is run, calls automate_communication(), sleeps for a bit, and then calls automate_passovers().
    """
    automate_communication()
    time.sleep(60)
    automate_passovers()


if __name__ == '__main__':
    main()
